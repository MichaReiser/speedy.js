import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {llvmArrayValue} from "../util/llvm-array-helpers";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {MethodReference} from "./method-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectIndexReference} from "./object-index-reference";

export class ArrayReference extends BuiltInObjectReference {

    private llvmArrayType: llvm.Type;
    private elementType: ts.Type;
    private llvmElementType: llvm.Type;
    private sizeType: llvm.Type;

    static getElementType(type: ts.Type): ts.Type {
        const genericType = type as ts.GenericType;
        assert(genericType.typeArguments.length === 1, "An array type needs to have one type argument, the type of the array elements");

        return genericType.typeArguments[0]!;
    }

    static getArrayType(context: CodeGenerationContext) {
        return llvm.Type.getIntNTy(context.llvmContext, context.module.dataLayout.getPointerSize(0)).getPointerTo();
    }

    constructor(objectAddress: llvm.Value, type: ts.Type, context: CodeGenerationContext) {
        super(objectAddress, type, context);

        this.elementType = ArrayReference.getElementType(type);
        this.llvmArrayType = ArrayReference.getArrayType(context);
        this.llvmElementType = toLLVMType(this.elementType, context);
        this.sizeType = llvm.Type.getInt32Ty(context.llvmContext);
    }

    protected get typeName(): string {
        return "Array";
    }

    protected createFunctionFor(symbol: ts.Symbol, callExpression: ts.CallExpression): MethodReference {
        let fn: llvm.Function;
        const signature = this.context.typeChecker.getResolvedSignature(callExpression);

        switch (symbol.name) {
            case "fill":
                return this.createFillFunction(signature, callExpression.arguments.length);
            case "push":
                return this.createPushFunction(signature);
            case "pop":
                fn = this.createPopFunction();
                break;
            case "shift":
                fn = this.createShiftFunction();
                break;
            case "unshift":
                return this.createUnshiftFunction(signature);
            default:
                return this.throwUnsupportedBuiltIn(callExpression, symbol);
        }

        return this.context.methodReference(this, fn, signature);
    }

    private createFillFunction(signature: ts.Signature, numberOfArguments: number) {
        const fnName = this.getFunctionName(numberOfArguments <= 2 ? "array_fill_ii" : "array_fill_iii");
        const argTypes = [this.llvmArrayType, this.llvmElementType, this.sizeType];
        const fillFunction = this.context.module.getOrInsertFunction(fnName, llvm.FunctionType.get(this.llvmArrayType, argTypes, false)) as llvm.Function;

        class FillMethod extends MethodReference {
            constructor(array: ArrayReference, context: CodeGenerationContext) {
                super(array, fillFunction, signature, context);
            }

            getCallArguments(args: llvm.Value[]) {
                if (args.length < 2) {
                    return [
                        args[0],
                        llvm.ConstantInt.get(this.context.llvmContext, 0)
                    ];
                }
                return args;
            }
        }

        return new FillMethod(this, this.context);
    }

    private createPopFunction() {
        return this.context.module.getOrInsertFunction(this.getFunctionName("pop"), llvm.FunctionType.get(this.llvmElementType, [this.llvmArrayType], false)) as llvm.Function;
    }

    private createPushFunction(signature: ts.Signature) {
        const pushFunction = this.context.module.getOrInsertFunction(
            this.getFunctionName("push"),
            llvm.FunctionType.get(this.sizeType, [this.llvmArrayType, this.llvmElementType.getPointerTo(), this.sizeType], false)
        ) as llvm.Function;

        const llvmElementType = this.llvmElementType;

        class PushMethod extends MethodReference {
            constructor(array: ArrayReference, context: CodeGenerationContext) {
                super(array, pushFunction, signature, context);
            }

            getCallArguments(args: llvm.Value[]) {
                return [
                    llvmArrayValue(args, llvmElementType, this.context),
                    llvm.ConstantInt.get(this.context.llvmContext, args.length)
                ];
            }
        }

        return new PushMethod(this, this.context);
    }

    private createShiftFunction() {
        return this.context.module.getOrInsertFunction(
            this.getFunctionName("shift"),
            llvm.FunctionType.get(this.llvmElementType, [this.llvmArrayType], false)
        ) as llvm.Function;
    }

    private createUnshiftFunction(signature: ts.Signature) {
        const unshiftFunction = this.context.module.getOrInsertFunction(
            this.getFunctionName("unshift"),
            llvm.FunctionType.get(this.sizeType, [this.llvmArrayType, this.llvmElementType.getPointerTo(), this.sizeType], false)
        ) as llvm.Function;

        const llvmElementType = this.llvmElementType;

        class UnshiftMethod extends MethodReference {
            constructor(array: ArrayReference, context: CodeGenerationContext) {
                super(array, unshiftFunction, signature, context);
            }

            getCallArguments(args: llvm.Value[]) {
                return [
                    llvmArrayValue(args, llvmElementType, this.context),
                    llvm.ConstantInt.get(this.context.llvmContext, args.length)
                ];
            }
        }

        return new UnshiftMethod(this, this.context);
    }

    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression): ObjectPropertyReference {
        const type = this.context.typeChecker.getTypeAtLocation(propertyAccess);
        switch (symbol.name) {
            case "length":
                return this.createLengthProperty(type);

            default:
                return this.throwUnsupportedBuiltIn(propertyAccess);
        }
    }

    private createLengthProperty(type: ts.Type): ObjectPropertyReference {
        const getter = this.context.module.getOrInsertFunction(
            this.getFunctionName("array_length"),
            llvm.FunctionType.get(this.sizeType, [this.llvmArrayType], false)
        ) as llvm.Function;

        const setter = this.context.module.getOrInsertFunction(
            this.getFunctionName("array_set_length"),
            llvm.FunctionType.get(this.sizeType, [this.llvmArrayType, this.sizeType], false)
        ) as llvm.Function;

        return new ObjectPropertyReference(type, this, getter, setter, this.context);
    }

    public getIndexer(elementAccessExpression: ts.ElementAccessExpression) {
        const getter = this.context.module.getOrInsertFunction(
            this.getFunctionName("array_get"),
            llvm.FunctionType.get(this.llvmElementType, [this.llvmArrayType, this.sizeType], false)
        ) as llvm.Function;

        const setter = this.context.module.getOrInsertFunction(
            this.getFunctionName("array_set"),
            llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [this.llvmArrayType, this.sizeType, this.llvmElementType], false)
        ) as llvm.Function;

        const type = this.context.typeChecker.getTypeAtLocation(elementAccessExpression);
        const index = this.context.generateValue(elementAccessExpression.argumentExpression!);

        return new ObjectIndexReference(type, this, index, getter, setter, this.context);
    }

    /**
     * Inserts the instruction that releases the memory allocated by the array
     */
    destruct() {
        const deleteFunction = this.context.module.getOrInsertFunction(
            this.getFunctionName("delete_array"),
            llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [this.llvmArrayType], false)
        );

        this.context.builder.createCall(deleteFunction, [this.generateIR()]);
    }

    private getFunctionName(name: string): string {
        return `${name}_${this.getArrayFunctionPostfix()}`;
    }

    private getArrayFunctionPostfix(): string | never {
        if (this.elementType.flags & ts.TypeFlags.IntLike) {
            return "i32";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.BooleanLike) {
            return "i1";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.Number) {
            return "f64";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.Object) {
            return "ptr";
        }

        throw new Error(`Unsupported Element Type for Array`);
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {MethodReference} from "./method-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {FunctionReferenceBuilder} from "./function-reference-builder";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {ObjectPropertyReferenceBuilder} from "./object-property-reference-builder";
import {ObjectIndexReferenceBuilder} from "./object-index-reference-builder";
import {ArrayClassReference} from "./array-class-reference";
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

    constructor(objectAddress: llvm.Value, type: ts.ObjectType, context: CodeGenerationContext) {
        super(objectAddress, type, context);

        this.elementType = ArrayReference.getElementType(type);
        this.llvmArrayType = ArrayClassReference.getArrayType(context);
        this.llvmElementType = toLLVMType(this.elementType, context);
        this.sizeType = llvm.Type.getInt32Ty(context.llvmContext);
    }

    protected get typeName(): string {
        return "Array";
    }

    protected createFunctionFor(symbol: ts.Symbol, callExpression: ts.CallExpression): MethodReference {
        switch (symbol.name) {
            case "fill":
            case "unshift":
            case "push":
            case "pop":
            case "shift":
                return FunctionReferenceBuilder
                    .forCall(callExpression, this.context)
                    .fromRuntime()
                    .methodReference(this);
            default:
                return this.throwUnsupportedBuiltIn(callExpression, symbol);
        }
    }

    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression): ObjectPropertyReference {
        switch (symbol.name) {
            case "length":
                return ObjectPropertyReferenceBuilder
                    .forProperty(propertyAccess, this.context)
                    .fromRuntime()
                    .build(this);

            default:
                return this.throwUnsupportedBuiltIn(propertyAccess);
        }
    }

    public getIndexer(elementAccessExpression: ts.ElementAccessExpression): ObjectIndexReference {
        return ObjectIndexReferenceBuilder
            .forElement(elementAccessExpression, this.context)
            .fromRuntime()
            .build(this);
    }

    /**
     * Inserts the instruction that releases the memory allocated by the array
     */
    destruct() {
        const nameMangler = new RuntimeSystemNameMangler(this.context.compilationContext);
        const fnName = nameMangler.mangleFunctionName({
            classType: this.type,
            functionName: "free",
            returnType: undefined as any,
            arguments: []
        });

        const deleteFunction = this.context.module.getOrInsertFunction(
            fnName,
            llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [this.llvmArrayType], false)
        );

        this.context.builder.createCall(deleteFunction, [this.generateIR()]);
    }
}

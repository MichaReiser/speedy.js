import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {ArrayReference} from "./array-reference";
import {Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {llvmArrayValue} from "../util/llvm-array-helpers";
import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";

export class ArrayClassReference extends ClassReference {
    private constructor(typeInformation: llvm.GlobalVariable, symbol: ts.Symbol, context: CodeGenerationContext) {
        super(typeInformation, symbol, context);
    }

    static create(symbol: ts.Symbol, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(symbol, context);
        return new ArrayClassReference(typeInformation, symbol, context);
    }

    objectFor(pointer: llvm.Value, type: ts.Type) {
        return new ArrayReference(pointer, type, this.context)
    }

    fromLiteral(type: ts.Type, elements: Value[]): ArrayReference {
        const elementType = ArrayReference.getElementType(type);
        const constructorFn = getConstructorFunction(elementType, this.context);
        const elementValues = elements.map(element => element.generateIR());
        const args = getArgumentsForConstructorPassingElements(elementValues, elementType, this.context);

        return FunctionReference.invoke(constructorFn, args, type, this.context) as ArrayReference;
    }

    getFields() {
        return [];
    }

    getConstructor(signature: ts.Signature): FunctionReference {
        const elementType = ArrayReference.getElementType(signature.getReturnType());
        const parameters = signature.getParameters();
        switch (parameters.length) {
            case 1:
                if (signature.parameters[0].name === "arrayLength") {
                    return new ArrayOfSizeConstructorFunction(elementType, signature, this.context);
                }
            // Fall through, array with one, non int element
            default:
                return new ArrayOfElementsConstructorFunction(elementType, signature, this.context);
        }
    }

    getLLVMType(type: ts.Type): llvm.Type {
        return ArrayReference.getArrayType(this.context);
    }
}

class ArrayOfSizeConstructorFunction extends FunctionReference {

    constructor(private elementType: ts.Type, signature: ts.Signature, context: CodeGenerationContext) {
        super(getConstructorFunction(elementType, context), signature, context);
    }

    getCallArguments(args: llvm.Value[]) {
        assert(args.length === 1, "The new Array<T>(size) constructor accepts a single argument, the size");
        const elementPtrType = toLLVMType(this.elementType, this.context).getPointerTo();
        return [args[0], llvm.ConstantPointerNull.get(elementPtrType)];
    }
}

class ArrayOfElementsConstructorFunction extends FunctionReference {

    constructor(private elementType: ts.Type, signature: ts.Signature, context: CodeGenerationContext) {
        super(getConstructorFunction(elementType, context), signature, context);
    }

    getCallArguments(args: llvm.Value[]) {
        return getArgumentsForConstructorPassingElements(args, this.elementType, this.context);
    }
}

function getArgumentsForConstructorPassingElements(elements: llvm.Value[], elementType: ts.Type, context: CodeGenerationContext) {
    const llvmElementType = toLLVMType(elementType, context);
    let elementsArray;
    if (elements.length === 0) {
        elementsArray = llvm.ConstantPointerNull.get(llvmElementType.getPointerTo());
    } else {
        elementsArray = llvmArrayValue(elements, llvmElementType, context, "elements");
    }

    return [ llvm.ConstantInt.get(context.llvmContext, elements.length), elementsArray ];
}

function getConstructorFunction(elementType: ts.Type, context: CodeGenerationContext) {
    const elementsPtrType = toLLVMType(elementType, context).getPointerTo();

    return context.module.getOrInsertFunction(
        getNewFunctionName(elementType),
        llvm.FunctionType.get(ArrayReference.getArrayType(context), [ llvm.Type.getInt32Ty(context.llvmContext), elementsPtrType], false)) as llvm.Function;
}

function getNewFunctionName(elementType: ts.Type): string {
    return `new_array_${getArrayFunctionPostfix(elementType)}`;
}

function getArrayFunctionPostfix(elementType: ts.Type): string | never {
    if (elementType.flags & ts.TypeFlags.IntLike) {
        return "i32";
    }

    if (elementType.getFlags() & ts.TypeFlags.BooleanLike) {
        return "i1";
    }

    if (elementType.getFlags() & ts.TypeFlags.Number) {
        return "f64";
    }

    if (elementType.getFlags() & ts.TypeFlags.Object) {
        return "ptr";
    }

    throw new Error(`Unsupported Element Type for Array`);
}

import * as assert from "assert";
import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../../code-generation-error";

/**
 * Returns the llvm type for the given typescript type
 * @param type the type script type to convert into an llvm type
 * @param context the code generation context
 * @return the llvm type
 */
export function toLLVMType(type: ts.Type, context: CodeGenerationContext): llvm.Type {
    if (type.flags & ts.TypeFlags.IntLike) {
        return llvm.Type.getInt32Ty(context.llvmContext);
    }

    if (type.flags & ts.TypeFlags.NumberLike) {
        return llvm.Type.getDoubleTy(context.llvmContext);
    }

    if (type.flags & ts.TypeFlags.BooleanLike) {
        return llvm.Type.getInt1Ty(context.llvmContext);
    }

    if (type.flags & ts.TypeFlags.Any) {
        throw new Error(`Any type not supported, annotate the type`);
    }

    if (type.flags & ts.TypeFlags.Void) {
        return llvm.Type.getVoidTy(context.llvmContext);
    }

    if (type.flags & ts.TypeFlags.Object) {
        const classReference = context.resolveClass(type);
        if (classReference) {
            return classReference.getLLVMType(type as ts.ObjectType, context).getPointerTo();
        }
    }

    if (type.getSymbol() && type.getSymbol().getDeclarations().length > 0) {
        throw CodeGenerationError.unsupportedType(type.getSymbol().getDeclarations()[0], context.typeChecker.typeToString(type));
    }

    throw new Error(`Unsupported type with symbol ${context.typeChecker.typeToString(type)}`);
}

export function getArrayElementType(arrayType: ts.Type): ts.Type {
    const genericType = arrayType as ts.GenericType;
    assert(genericType.typeArguments.length === 1, "An array type needs to have one type argument, the type of the array elements");

    return genericType.typeArguments[0]!;
}

/**
 * Computes the size of the given type
 * http://stackoverflow.com/questions/14608250/how-can-i-find-the-size-of-a-type
 * @param type the type of which the size is to be computed
 * @param context the code generation context
 * @return {Value} the value containing the size of the type
 */
export function sizeof(type: llvm.Type, context: CodeGenerationContext) {
    const size = context.module.dataLayout.getTypeStoreSize(type);
    return llvm.ConstantInt.get(context.llvmContext, size);
}

/**
 * Computes the offset of a field
 * @param type the type of the class
 * @param field the field number for which the offset is to be computed
 * @param context the context
 * @return {Value} the offset as llvm.value
 */
export function offset(type: llvm.PointerType, field: number, context: CodeGenerationContext) {
    const offset = context.builder.createInBoundsGEP(llvm.ConstantPointerNull.get(type), [ llvm.ConstantInt.get(context.llvmContext, 0), llvm.ConstantInt.get(context.llvmContext, field)]);
    return context.builder.createPtrToInt(offset, llvm.Type.getInt32Ty(context.llvmContext), "offset");
}

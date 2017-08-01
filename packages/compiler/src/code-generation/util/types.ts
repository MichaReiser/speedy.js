import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Returns the llvm type for the given typescript type
 * @param type the type script type to convert into an llvm type
 * @param context the code generation context
 * @return the llvm type
 * @deprecated use context.toLLVMType instead.
 */
export function toLLVMType(type: ts.Type, context: CodeGenerationContext): llvm.Type {
   return context.toLLVMType(type);
}

/**
 * Tests if the given type describes a reference to a function
 * @param {ts.Type} type the type to test
 * @return {boolean} true if this type is a function type, false other wise
 */
export function isFunctionType(type: ts.Type) {
    if (type.flags & ts.TypeFlags.Union) {
        const unionType = type as ts.UnionType;

        if (unionType.types.length === 2 && unionType.types.some(t => !!(t.flags & ts.TypeFlags.Undefined))) {
            type = unionType.types.find(t => !(t.flags & ts.TypeFlags.Undefined))!;
        }
    }

    if (type.flags & ts.TypeFlags.Object) {
        return type.getCallSignatures().length === 1 && type.getProperties().length === 0;
    }

    return false;
}

export function getCallSignature(type: ts.Type) {
    assert(isFunctionType(type), "Function type expected");

    if (type.flags & ts.TypeFlags.Union) {
        const unionType = type as ts.UnionType;

        if (unionType.types.length === 2 && unionType.types.some(t => !!(t.flags & ts.TypeFlags.Undefined))) {
            type = unionType.types.find(t => !(t.flags & ts.TypeFlags.Undefined))!;
        }
    }

    assert(type.getCallSignatures().length === 1, "Overloaded functions not yet supported");

    return type.getCallSignatures()[0];
}

/**
 * Tests if the given type is a maybe object type (objectType | undefined).
 * @param type the type to test
 * @return {boolean} true if the type contains either an object or undefined
 */
export function isMaybeObjectType(type: ts.Type): type is ts.UnionType {
    if (type.flags & ts.TypeFlags.Union) {
        const unionType = type as ts.UnionType;

        return unionType.types.length === 2 &&
            unionType.types.some(t => !!(t.flags & ts.TypeFlags.Undefined)) &&
            unionType.types.some(t => !!(t.flags & ts.TypeFlags.Object));
    }

    return false;
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
    const fieldIndex = [ llvm.ConstantInt.get(context.llvmContext, 0), llvm.ConstantInt.get(context.llvmContext, field)];
    const fieldOffset = context.builder.createInBoundsGEP(llvm.ConstantPointerNull.get(type), fieldIndex);
    return context.builder.createPtrToInt(fieldOffset, llvm.Type.getInt32Ty(context.llvmContext), "offset");
}

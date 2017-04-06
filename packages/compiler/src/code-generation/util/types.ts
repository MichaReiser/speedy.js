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

    if (type.flags & ts.TypeFlags.Object && context.scope.hasClass(type.getSymbol())) {
        const classReference = context.scope.getClass(type.getSymbol());
        if (classReference) {
            return classReference.getLLVMType(type as ts.ObjectType, context);
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

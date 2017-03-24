import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../code-generation-exception";

export function toLLVMType(type: ts.Type, context: CodeGenerationContext): llvm.Type {
    if ((type.flags & ts.TypeFlags.IntLike) === ts.TypeFlags.Int) {
        return llvm.Type.getInt32Ty(context.llvmContext);
    }

    if ((type.flags & ts.TypeFlags.NumberLike) === ts.TypeFlags.Number) {
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
        const classReference = context.scope.getClass(type.getSymbol());
        if (classReference) {
            return classReference.getLLVMType(type);
        }
    }

    throw CodeGenerationError.unsupportedType(type.getSymbol().getDeclarations()[0], context.typeChecker.typeToString(type));
}

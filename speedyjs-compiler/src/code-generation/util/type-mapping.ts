import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "./array-code-generator";

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
        throw new Error(`Any type not supported, annotated the type`);
    }

    if (type.flags & ts.TypeFlags.Object) {
        const symbol = type.getSymbol();

        if (symbol.name === "Array" && !context.scope.hasVariable(symbol)) { // OK, this is a built in array
            return ArrayCodeGenerator.getLLVMArrayType(context);
        }
    }

    throw new Error(`Unsupported type ${type.intrinsicName} ${type.flags} (${context.typeChecker.typeToString(type)}`);
}

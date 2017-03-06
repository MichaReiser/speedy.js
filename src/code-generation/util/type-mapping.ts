import * as ts from "typescript";
import * as llvm from "llvm-node";

export function toLLVMType(type: ts.Type, context: llvm.LLVMContext): llvm.Type {
    if ((type.flags & ts.TypeFlags.Number) === ts.TypeFlags.Number) {
        return llvm.Type.getDoubleTy(context);
    }

    if ((type.flags & ts.TypeFlags.Boolean) === ts.TypeFlags.Boolean) {
        return llvm.Type.getInt1Ty(context);
    }

    throw new Error(`Unsupported type ${(type as any).intrinsicName} ${type.flags}`);
}

import * as llvm from "llvm-node";

export function createAllocationInEntryBlock(fun: llvm.Function, type: llvm.Type, variableName?: string): llvm.AllocaInst {
    const entryBlockBuilder = new llvm.IRBuilder(fun.getEntryBlock());
    return entryBlockBuilder.createAlloca(type, undefined, variableName);
}


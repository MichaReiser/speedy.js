import * as ts from "typescript";
import * as llvm from "llvm-node";

export interface CompilationContext {
    readonly compilerHost: ts.CompilerHost;
    readonly program: ts.Program;
    readonly compilerOptions: ts.CompilerOptions;
    readonly llvmContext: llvm.LLVMContext;
}

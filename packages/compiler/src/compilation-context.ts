import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SpeedyJSCompilerOptions} from "./speedyjs-compiler-options";
import {BuiltInSymbols} from "./built-in-symbols";

export interface CompilationContext {
    readonly compilerHost: ts.CompilerHost;
    readonly program: ts.Program;
    readonly compilerOptions: SpeedyJSCompilerOptions;
    readonly llvmContext: llvm.LLVMContext;
    readonly builtIns: BuiltInSymbols;
}

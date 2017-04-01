import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SpeedyJSCompilerOptions} from "./speedyjs-compiler-options";
import {BuiltInSymbols} from "./built-in-symbols";
import {TypeChecker} from "./type-checker";

export interface CompilationContext {
    readonly builtIns: BuiltInSymbols;
    readonly compilerHost: ts.CompilerHost;
    readonly compilerOptions: SpeedyJSCompilerOptions;
    readonly llvmContext: llvm.LLVMContext;
    readonly typeChecker: TypeChecker;

    /**
     * The root directory where the source files are located
     */
    readonly rootDir: string;
}

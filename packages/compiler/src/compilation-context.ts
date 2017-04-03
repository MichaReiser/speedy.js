import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SpeedyJSCompilerOptions} from "./speedyjs-compiler-options";
import {BuiltInSymbols} from "./built-in-symbols";
import {TypeChecker} from "./type-checker";

/**
 * The context of a compilation (of a whole program).
 * In comparison to the {@link CodeGenerationContext} is this context not for a single output but
 * instead for the whole compilation process.
 */
export interface CompilationContext {
    /**
     * The built in symbols
     */
    readonly builtIns: BuiltInSymbols;

    /**
     * The compiler host
     */
    readonly compilerHost: ts.CompilerHost;

    /**
     * The options passed to the compiler
     */
    readonly compilerOptions: SpeedyJSCompilerOptions;

    /**
     * The llvm context for this compilation
     */
    readonly llvmContext: llvm.LLVMContext;

    /**
     * The type checker instance for this compilation
     */
    readonly typeChecker: TypeChecker;

    /**
     * The root directory where the source files are located
     */
    readonly rootDir: string;
}

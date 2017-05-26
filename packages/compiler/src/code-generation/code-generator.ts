import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";

/**
 * WASM Code Generator and transformer of the type script source file
 */
export interface CodeGenerator {
    /**
     * Starts the compilation of theg iven source file
     * @param sourceFile the source file that is now being compiled
     * @param compilationContext the compilation context
     * @param requestEmitHelper function that allows to request type script emit helpers
     */
    beginSourceFile(sourceFile: ts.SourceFile, compilationContext: CompilationContext, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): void;

    /**
     * Generates an entry function for the given function declaration
     * @param fn the function declaration
     * @returns the transformed function declaration that invokes the wasm function instead of the original
     * ts source code
     * @throws if called before beginSourceFile is called
     */
    generateEntryFunction(fn: ts.FunctionDeclaration): ts.FunctionDeclaration;

    /**
     * Finalizes the compilation for the given source file
     * @param sourceFile the source file for which all the code has been generated
     * @returns the transformed source file that contains the wasm module
     */
    completeSourceFile(sourceFile: ts.SourceFile): ts.SourceFile;

    /**
     * Called when the compilation of all source files is complete
     */
    completeCompilation(): void;
}

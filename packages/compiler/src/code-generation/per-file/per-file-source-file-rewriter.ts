import * as ts from "typescript";
import {WastMetaData} from "./wast-meta-data";

export type EmitHelperProvider = (emitHelper: ts.EmitHelper) => void;

/**
 * Rewriter for a single source file
 */
export interface PerFileSourceFileRewirter {

    /**
     * Sets the wast metadata
     * @param metadata the metadata
     */
    setWastMetaData(metadata: WastMetaData): void;

    /**
     * Sets the url to the wasm file
     * @param wasmUrl the url to the wasm file
     */
    setWasmUrl(wasmUrl: string): void;

    /**
     * Rewrites a SpeedyJS entry function
     * @param name the name of the function in the compilation
     * @param functionDeclaration the entry function to rewrite
     * @param requestEmitHelper function that allows to request type script emit helpers
     */
    rewriteEntryFunction(name: string, functionDeclaration: ts.FunctionDeclaration, requestEmitHelper: EmitHelperProvider): ts.FunctionDeclaration;

    /**
     * Rewrites the statements of the source file
     * @param sourceFile the source file to rewrite
     * @param requestEmitHelper function that allows to request type script emit helpers
     */
    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile;
}

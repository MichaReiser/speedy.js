import * as ts from "typescript";
import {WastMetaData} from "./wast-meta-data";

/**
 * Rewriter for a single source file
 */
export interface PerFileSourceFileRewirter {
    /**
     * Sets the output for this source file
     * @param output the output
     * @param wastMetadata the metadata from the wast file
     */
    setWasmOutput(output: Buffer, wastMetadata: WastMetaData): void;

    /**
     * Rewrites a SpeedyJS entry function
     * @param functionDeclaration the entry function to rewrite
     * @param requestEmitHelper function that allows to request type script emit helpers
     */
    rewriteEntryFunction(functionDeclaration: ts.FunctionDeclaration, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.FunctionDeclaration;

    /**
     * Rewrites the statements of the source file
     * @param statements the statements of the source file
     * @param requestEmitHelper function that allows to request type script emit helpers
     */
    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile;
}

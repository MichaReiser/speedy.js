import * as ts from "typescript";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";

/**
 * If the compiler is set to emit llvm code instead of WASM files, than the source files should not be rewritten
 */
export class NoopSourceFileRewriter implements PerFileSourceFileRewirter {
    setWastMetaData(metadata: WastMetaData): void {
        // noop
    }
    setWasmUrl(wasmUrl: string): void {
        // noop
    }

    rewriteEntryFunction(name: string, functionDeclaration: ts.FunctionDeclaration, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.FunctionDeclaration {
        return functionDeclaration;
    }

    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile {
        return sourceFile;
    }
}

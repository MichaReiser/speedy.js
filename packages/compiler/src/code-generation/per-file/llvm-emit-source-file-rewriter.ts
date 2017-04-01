import * as ts from "typescript";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";

/**
 * If the compiler is set to emit llvm code instead of WASM files, than the source files should not be rewritten
 */
export class LLVMEmitSourceFileRewriter implements PerFileSourceFileRewirter {
    setWasmOutput(output: Buffer): void {
        // noopp
    }

    rewriteEntryFunction(functionDeclaration: ts.FunctionDeclaration, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.FunctionDeclaration {
        return functionDeclaration;
    }

    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile {
        return sourceFile;
    }
}

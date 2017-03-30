import * as ts from "typescript";
import * as assert from "assert";

import {MODULE_LOADER_FACTORY_NAME, PerFileWasmLoaderEmitHelper} from "./per-file-wasm-loader-emit-helper";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";
import {SpeedyJSCompilerOptions} from "../../speedyjs-compiler-options";

/**
 * Inserts a wasm module loader function, the wasm byte code and rewrites the entry functions to call the wasm module.
 */
export class PerFileCodeGeneratorSourceFileRewriter implements PerFileSourceFileRewirter {
    private loadWasmFunctionIdentifier: ts.Identifier | undefined;
    private wasmOutput: Buffer | undefined;
    private wastMetaData: Partial<WastMetaData> = {};

    constructor(private typeChecker: ts.TypeChecker, private compilerOptions: SpeedyJSCompilerOptions) {}

    setWasmOutput(output: Buffer, wastMetaData: WastMetaData): void {
        this.wasmOutput = output;
        this.wastMetaData = wastMetaData;
    }

    /**
     * Generates a new function declaration with an equal signature but replaced body. The body looks like
     * @code
     * const instance = await loadWasmModule();
     * return instance.exports.fn.apply(undefined, arguments);
     *
     * fn is replaced with the name of the function declaration
     * @param functionDeclaration the function declaration to transform
     * @return the new function declaration that acts as proxy / facade for a wasm function
     */
    rewriteEntryFunction(functionDeclaration: ts.FunctionDeclaration): ts.FunctionDeclaration {
        this.loadWasmFunctionIdentifier = this.loadWasmFunctionIdentifier || ts.createUniqueName("loadWasmModule");
        const signature = this.typeChecker.getSignatureFromDeclaration(functionDeclaration);

        const bodyStatements: ts.Statement[] = [];

        // const instance = await loadWasmModule();
        const instanceIdentifier = ts.createIdentifier("instance");
        const instanceLoaded = ts.createAwait(ts.createCall(this.loadWasmFunctionIdentifier, [], []));
        const instanceDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(instanceIdentifier, undefined, instanceLoaded)], ts.NodeFlags.Const);
        bodyStatements.push(ts.createVariableStatement([], instanceDeclaration));

        // return instance.exports.fn(args)
        const wasmExports = ts.createPropertyAccess(instanceIdentifier,"exports");
        const targetFunction = ts.createPropertyAccess(wasmExports, functionDeclaration.name!);
        const args = signature.parameters.map(parameter => ts.createIdentifier(parameter.name));
        const functionCall = ts.createCall(targetFunction, [], args);

        bodyStatements.push(ts.createReturn(functionCall));
        const body = ts.createBlock(bodyStatements);

        return ts.updateFunctionDeclaration(
            functionDeclaration,
            functionDeclaration.decorators,
            functionDeclaration.modifiers,
            functionDeclaration.asteriskToken,
            functionDeclaration.name,
            functionDeclaration.typeParameters,
            functionDeclaration.parameters,
            functionDeclaration.type,
            body
        );
    }

    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile {
        if (!this.loadWasmFunctionIdentifier) {
            return sourceFile;
        }

        requestEmitHelper(new PerFileWasmLoaderEmitHelper());
        const initializer = ts.createCall(ts.createIdentifier(MODULE_LOADER_FACTORY_NAME), [], [
            this.getWasmBinary(),
            ts.createNumericLiteral(this.compilerOptions.totalStack + ""),
            ts.createNumericLiteral(this.compilerOptions.totalMemory + ""),
            ts.createNumericLiteral(this.compilerOptions.globalBase + ""),
            ts.createNumericLiteral((this.wastMetaData.staticBump || 0) + "")
        ]);
        const declaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(this.loadWasmFunctionIdentifier, undefined, initializer)], ts.NodeFlags.Const);

        const statements = sourceFile.statements;
        statements.unshift(ts.createVariableStatement([], declaration));

        return ts.updateSourceFileNode(sourceFile, statements);
    }

    private getWasmBinary(): ts.Expression {
        assert (this.wasmOutput, `No wasm output set but requested to transform the source file`);
        const buffer = this.wasmOutput!;

        let elements: ts.Expression[] = new Array<ts.Expression>(buffer.length);
        for (let i = 0; i < buffer.length; ++i) {
            elements[i] = ts.createNumericLiteral(buffer[i] + "");
        }

        const uint8From = ts.createPropertyAccess(ts.createIdentifier("Uint8Array"), ts.createIdentifier("from"));
        return ts.createCall(uint8From, [], [ts.createArrayLiteral(elements)]);
    }
}

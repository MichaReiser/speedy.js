import * as ts from "typescript";
import * as assert from "assert";

import {MODULE_LOADER_FACTORY_NAME, PerFileWasmLoaderEmitHelper} from "./per-file-wasm-loader-emit-helper";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";
import {SpeedyJSCompilerOptions} from "../../speedyjs-compiler-options";
import {TypeChecker} from "../../type-checker";

/**
 * Inserts a wasm module loader function, the wasm byte code and rewrites the entry functions to call the wasm module.
 */
export class PerFileCodeGeneratorSourceFileRewriter implements PerFileSourceFileRewirter {
    private loadWasmFunctionIdentifier: ts.Identifier | undefined;
    private wasmOutput: Buffer | undefined;
    private wastMetaData: Partial<WastMetaData> = {};

    constructor(private typeChecker: TypeChecker, private compilerOptions: SpeedyJSCompilerOptions) {}

    setWasmOutput(output: Buffer, wastMetaData: WastMetaData): void {
        this.wasmOutput = output;
        this.wastMetaData = wastMetaData;
    }

    /**
     * Generates a new function declaration with an equal signature but replaced body. The body looks like
     * @code
     * const instance = await loadWasmModule();
     * const result = instance.exports.fn.apply(undefined, arguments);
     *
     * speedyJsGc(); // only if not disableHeapNukeOnExit is set
     *
     * return result;
     *
     * fn is replaced with the passed in name
     * @param name the name of the function in the compilation
     * @param functionDeclaration the function declaration to transform
     * @return the new function declaration that acts as proxy / facade for a wasm function
     */
    rewriteEntryFunction(name: string, functionDeclaration: ts.FunctionDeclaration): ts.FunctionDeclaration {
        this.loadWasmFunctionIdentifier = this.loadWasmFunctionIdentifier || ts.createUniqueName("loadWasmModule");
        const signature = this.typeChecker.getSignatureFromDeclaration(functionDeclaration);

        const bodyStatements: ts.Statement[] = [];

        // const instance = await loadWasmModule();
        const instanceIdentifier = ts.createIdentifier("instance");
        const instanceLoaded = ts.createAwait(ts.createCall(this.loadWasmFunctionIdentifier, [], []));
        const instanceDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(instanceIdentifier, undefined, instanceLoaded)], ts.NodeFlags.Const);
        bodyStatements.push(ts.createVariableStatement([], instanceDeclaration));

        // const result = instance.exports.fn(args)
        const wasmExports = ts.createPropertyAccess(instanceIdentifier,"exports");
        const targetFunction = ts.createPropertyAccess(wasmExports, name);
        const args = signature.parameters.map(parameter => ts.createIdentifier(parameter.name));
        const functionCall = ts.createCall(targetFunction, [], args);
        const castedResult = this.castReturnValue(functionCall, (signature.getReturnType() as ts.TypeReference).typeArguments[0]);
        const resultVariable = ts.createVariableDeclaration("result", undefined, castedResult);
        bodyStatements.push(ts.createVariableStatement(undefined, [resultVariable]));

        if (!this.compilerOptions.disableHeapNukeOnExit) {
            // speedyJsGc();
            bodyStatements.push(ts.createStatement(ts.createCall(ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"), [], [])));
        }

        bodyStatements.push(ts.createReturn(ts.createIdentifier("result")));
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

        const options = ts.createObjectLiteral([
            ts.createPropertyAssignment("totalStack", ts.createLiteral(this.compilerOptions.totalStack)),
            ts.createPropertyAssignment("totalMemory", ts.createLiteral(this.compilerOptions.totalMemory)),
            ts.createPropertyAssignment("globalBase", ts.createLiteral(this.compilerOptions.globalBase)),
            ts.createPropertyAssignment("staticBump", ts.createLiteral(this.wastMetaData.staticBump || 0)),
            ts.createPropertyAssignment("exposeGc", ts.createLiteral(this.compilerOptions.exportGc || this.compilerOptions.exposeGc))
        ], true);

        const initializer = ts.createCall(ts.createIdentifier(MODULE_LOADER_FACTORY_NAME), [], [
            this.getWasmBinary(),
            options
        ]);

        const statementsToInsert: ts.Statement[] = [];

        // loadWasmModule = __moduleLoader(Uint8Array.from...., options }
        const loaderDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(this.loadWasmFunctionIdentifier, undefined, initializer)], ts.NodeFlags.Const);
        statementsToInsert.push(ts.createVariableStatement([], loaderDeclaration));

        // export let speedyJsGc = loadWasmModule_1.gc; or without export if only expose
        if (this.compilerOptions.exposeGc || this.compilerOptions.exportGc) {
            const speedyJsGcDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration("speedyJsGc", undefined, ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"))], ts.NodeFlags.Const);
            const modifiers = this.compilerOptions.exportGc ? [ ts.createToken(ts.SyntaxKind.ExportKeyword) ] : [];

            statementsToInsert.push(ts.createVariableStatement(modifiers, speedyJsGcDeclaration));
        }

        const statements = sourceFile.statements;
        statements.unshift(...statementsToInsert);
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

    private castReturnValue(returnValue: ts.Expression, type: ts.Type): ts.Expression {
        // wasm code returns 1 for true and zero for false. Cast it to a boolean
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return ts.createBinary(returnValue, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createNumericLiteral("1"));
        }

        return returnValue;
    }
}

import * as ts from "typescript";
import * as assert from "assert";

import {MODULE_LOADER_FACTORY_NAME, PerFileWasmLoaderEmitHelper} from "./per-file-wasm-loader-emit-helper";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";
import {getArrayElementType, toLLVMType} from "../util/types";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Inserts a wasm module loader function, the wasm byte code and rewrites the entry functions to call the wasm module.
 */
export class PerFileCodeGeneratorSourceFileRewriter implements PerFileSourceFileRewirter {

    private loadWasmFunctionIdentifier: ts.Identifier | undefined;
    private wasmUrl: string | undefined;
    private wastMetaData: Partial<WastMetaData> = {};

    constructor(private context: CodeGenerationContext) {}

    setWastMetaData(metadata: WastMetaData): void {
        this.wastMetaData = metadata;
    }

    setWasmUrl(wasmUrl: string): void {
        this.wasmUrl = wasmUrl;
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
        const signature = this.context.typeChecker.getSignatureFromDeclaration(functionDeclaration);

        const bodyStatements: ts.Statement[] = [];
        // const result = instance.exports.fn(args)
        const wasmExports = ts.createPropertyAccess(ts.createIdentifier("instance"), "exports");
        const targetFunction = ts.createPropertyAccess(wasmExports, name);
        const args = signature.declaration.parameters.map(parameter => this.toRuntimeArgument(parameter, this.loadWasmFunctionIdentifier!));
        const functionCall = ts.createCall(targetFunction, [], args);
        const castedResult = this.castReturnValue(functionCall, (signature.getReturnType() as ts.TypeReference).typeArguments[0], this.loadWasmFunctionIdentifier!);
        const resultVariable = ts.createVariableDeclaration("result", undefined, castedResult);
        bodyStatements.push(ts.createVariableStatement(undefined, [resultVariable]));

        if (!this.context.compilationContext.compilerOptions.disableHeapNukeOnExit) {
            // speedyJsGc();
            bodyStatements.push(ts.createStatement(ts.createCall(ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"), [], [])));
        }

        bodyStatements.push(ts.createReturn(ts.createIdentifier("result")));

        // function (instance) { ... }
        const loadedHandler = ts.createFunctionExpression(undefined, undefined, "instanceLoaded", undefined, [ts.createParameter(undefined, undefined, undefined, "instance") ], undefined, ts.createBlock(bodyStatements));

        // loadWasmModule().then(instance => );
        const loadInstance = ts.createCall(this.loadWasmFunctionIdentifier, [], []);
        const instanceLoaded = ts.createCall(ts.createPropertyAccess(loadInstance, "then"), [], [ loadedHandler ]);

        return ts.updateFunctionDeclaration(
            functionDeclaration,
            functionDeclaration.decorators,
            (functionDeclaration.modifiers || [] as ts.Modifier[]).filter(modifier => modifier.kind !== ts.SyntaxKind.AsyncKeyword),
            functionDeclaration.asteriskToken,
            functionDeclaration.name,
            functionDeclaration.typeParameters,
            functionDeclaration.parameters,
            functionDeclaration.type,
            ts.createBlock([ts.createReturn(instanceLoaded)])
        );
    }

    rewriteSourceFile(sourceFile: ts.SourceFile, requestEmitHelper: (emitHelper: ts.EmitHelper) => void): ts.SourceFile {
        assert (this.wasmUrl, `No wasm fetch expression set but requested to transform the source file`);

        if (!this.loadWasmFunctionIdentifier) {
            return sourceFile;
        }

        requestEmitHelper(new PerFileWasmLoaderEmitHelper());

        const compilerOptions = this.context.compilationContext.compilerOptions;

        const options = ts.createObjectLiteral([
            ts.createPropertyAssignment("totalStack", ts.createLiteral(compilerOptions.totalStack)),
            ts.createPropertyAssignment("initialMemory", ts.createLiteral(compilerOptions.initialMemory)),
            ts.createPropertyAssignment("globalBase", ts.createLiteral(compilerOptions.globalBase)),
            ts.createPropertyAssignment("staticBump", ts.createLiteral(this.wastMetaData.staticBump || 0)),
            ts.createPropertyAssignment("exposeGc", ts.createLiteral(compilerOptions.exportGc || compilerOptions.exposeGc))
        ], true);

        const initializer = ts.createCall(ts.createIdentifier(MODULE_LOADER_FACTORY_NAME), [], [
            ts.createLiteral(this.wasmUrl!),
            options
        ]);

        const statementsToInsert: ts.Statement[] = [];

        // loadWasmModule = __moduleLoader(filename, options }
        const loaderDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(this.loadWasmFunctionIdentifier, undefined, initializer)], ts.NodeFlags.Const);
        statementsToInsert.push(ts.createVariableStatement([], loaderDeclaration));

        // export let speedyJsGc = loadWasmModule_1.gc; or without export if only expose
        if (compilerOptions.exposeGc || compilerOptions.exportGc) {
            const speedyJsGcDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration("speedyJsGc", undefined, ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"))], ts.NodeFlags.Const);
            const modifiers = compilerOptions.exportGc ? [ ts.createToken(ts.SyntaxKind.ExportKeyword) ] : [];
            statementsToInsert.push(ts.createVariableStatement(modifiers, speedyJsGcDeclaration));
        }

        const statements = sourceFile.statements;
        statements.unshift(...statementsToInsert);
        return ts.updateSourceFileNode(sourceFile, statements);
    }

    private castReturnValue(returnValue: ts.Expression, type: ts.Type, loadWasmFunctionIdentifier: ts.Identifier): ts.Expression {
        // wasm code returns 1 for true and zero for false. Cast it to a boolean
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return ts.createBinary(returnValue, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createNumericLiteral("1"));
        }

        if (type.flags & ts.TypeFlags.Object) {
            if (this.context.compilationContext.builtIns.get("Array") === type.symbol) {
                return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toNativeArray"), undefined, [
                    returnValue,
                    ts.createLiteral(toLLVMType(getArrayElementType(type), this.context).toString())
                ]);
            }
        }

        return returnValue;
    }

    private toRuntimeArgument(parameterDeclaration: ts.ParameterDeclaration, loadWasmFunctionIdentifier: ts.Identifier): ts.Expression {
        const parameterType = this.context.typeChecker.getTypeAtLocation(parameterDeclaration);
        const symbol = this.context.typeChecker.getSymbolAtLocation(parameterDeclaration.name);

        if (parameterType.flags & ts.TypeFlags.Object) {
            if (this.context.compilationContext.builtIns.get("Array") === parameterType.symbol) {
                return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toRuntimeArray"), undefined, [
                    ts.createIdentifier(symbol.name),
                    ts.createLiteral(toLLVMType(getArrayElementType(parameterType), this.context).toString())
                ]);
            }
        }

        return ts.createIdentifier(symbol.name);
    }
}

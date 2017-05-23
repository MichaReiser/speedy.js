import * as ts from "typescript";
import * as assert from "assert";

import {MODULE_LOADER_FACTORY_NAME, PerFileWasmLoaderEmitHelper} from "./per-file-wasm-loader-emit-helper";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";
import {CodeGenerationContext} from "../code-generation-context";
import {TypeChecker} from "../../type-checker";

interface Types {
    [name: string]: {
        primitive: boolean,
        fields: { name: string, type: string }[],
        constructor?: ts.Identifier;
        typeArguments: string[];
    }
}

/**
 * Inserts a wasm module loader function, the wasm byte code and rewrites the entry functions to call the wasm module.
 */
export class PerFileCodeGeneratorSourceFileRewriter implements PerFileSourceFileRewirter {

    private loadWasmFunctionIdentifier: ts.Identifier | undefined;
    private wasmUrl: string | undefined;
    private wastMetaData: Partial<WastMetaData> = {};
    private argumentAndReturnTypes: ts.Type[] = [];

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
     * const result = instance.exports.fn.apply(undefined, arguments); // arguments are potentially cased
     *
     * speedyJsGc(); // only if not disableHeapNukeOnExit is set
     *
     * return result; // result is potentially casted
     *
     * fn is replaced with the passed in name
     * @param name the name of the function in the compilation
     * @param functionDeclaration the function declaration to transform
     * @return the new function declaration that acts as proxy / facade for a wasm function
     */
    rewriteEntryFunction(name: string, functionDeclaration: ts.FunctionDeclaration): ts.FunctionDeclaration {
        this.loadWasmFunctionIdentifier = this.loadWasmFunctionIdentifier || ts.createUniqueName("loadWasmModule");
        const signature = this.context.typeChecker.getSignatureFromDeclaration(functionDeclaration);
        this.argumentAndReturnTypes.push(signature.getReturnType());

        const argumentTypes = signature.declaration.parameters.map(parameter => this.context.typeChecker.getTypeAtLocation(parameter));
        this.argumentAndReturnTypes.push(...argumentTypes);

        const bodyStatements: ts.Statement[] = [];

        let argumentObjects: ts.Identifier;
        // argumentObjects = new Map();
        if (argumentTypes.findIndex(argumentType => (argumentType.flags & ts.TypeFlags.Object) !== 0) !== -1) {
            argumentObjects = ts.createUniqueName("argumentObjects");
            bodyStatements.push(ts.createVariableStatement(undefined, [ts.createVariableDeclaration(argumentObjects, undefined, ts.createNew(ts.createIdentifier("Map"), undefined, []))]));
        } else {
            argumentObjects = ts.createIdentifier("undefined");
        }

        // const result = instance.exports.fn(args)
        const instanceIdentifier = ts.createUniqueName("instance");
        const wasmExports = ts.createPropertyAccess(instanceIdentifier, "exports");
        const targetFunction = ts.createPropertyAccess(wasmExports, name);
        const args = signature.declaration.parameters.map(parameter => this.castToWasm(parameter, this.loadWasmFunctionIdentifier!, argumentObjects));
        const functionCall = ts.createCall(targetFunction, [], args);
        const castedResult = this.castToJs(functionCall, signature.getReturnType(), this.loadWasmFunctionIdentifier!);
        const resultIdentifier = ts.createUniqueName("result");
        const resultVariable = ts.createVariableDeclaration(resultIdentifier, undefined, castedResult);
        bodyStatements.push(ts.createVariableStatement(undefined, [resultVariable]));

        if (!this.context.compilationContext.compilerOptions.disableHeapNukeOnExit) {
            // speedyJsGc();
            bodyStatements.push(ts.createStatement(ts.createCall(ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"), [], [])));
        }

        bodyStatements.push(ts.createReturn(resultIdentifier));

        // function (instance) { ... }
        const loadedHandler = ts.createFunctionExpression(undefined, undefined, "instanceLoaded", undefined, [ts.createParameter(undefined, undefined, undefined, instanceIdentifier) ], undefined, ts.createBlock(bodyStatements));

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

        const options = toLiteral({
            totalStack: compilerOptions.totalStack,
            initialMemory: compilerOptions.initialMemory,
            globalBase: compilerOptions.globalBase,
            staticBump: this.wastMetaData.staticBump || 0,
            exposeGc: compilerOptions.exportGc || compilerOptions.exposeGc
        });

        const initializer = ts.createCall(ts.createIdentifier(MODULE_LOADER_FACTORY_NAME), [], [
            ts.createLiteral(this.wasmUrl!),
            this.serializeArgumentAndReturnTypes(),
            options
        ]);

        const statements = sourceFile.statements;

        // var loadWasmModule;
        const loaderDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(this.loadWasmFunctionIdentifier)], ts.NodeFlags.Let);
        statements.unshift(ts.createVariableStatement([], loaderDeclaration));

        // loadWasmModule = __moduleLoader(...
        const loadDefinition = ts.createBinary(this.loadWasmFunctionIdentifier!, ts.SyntaxKind.EqualsToken, initializer);
        statements.push(ts.createStatement(loadDefinition)); // Insert last to ensure that all classes are visible (entry functions need to be top level)

        // export let speedyJsGc = loadWasmModule_1.gc; or without export if only expose
        if (compilerOptions.exposeGc || compilerOptions.exportGc) {
            const speedyJsGcDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration("speedyJsGc", undefined, ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"))], ts.NodeFlags.Const);
            const modifiers = compilerOptions.exportGc ? [ ts.createToken(ts.SyntaxKind.ExportKeyword) ] : [];
            statements.push(ts.createVariableStatement(modifiers, speedyJsGcDeclaration));
        }

        return ts.updateSourceFileNode(sourceFile, statements);
    }

    private castToJs(returnValue: ts.Expression, type: ts.Type, loadWasmFunctionIdentifier: ts.Identifier): ts.Expression {
        // wasm code returns 1 for true and zero for false. Cast it to a boolean
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return ts.createBinary(returnValue, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createNumericLiteral("1"));
        }

        if (type.flags & ts.TypeFlags.Object) {
            return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toJSObject"), undefined, [
                returnValue,
                ts.createLiteral(serializedTypeName(type, this.context.typeChecker))
            ]);
        }

        return returnValue;
    }

    private castToWasm(parameterDeclaration: ts.ParameterDeclaration, loadWasmFunctionIdentifier: ts.Identifier, argumentObjects: ts.Identifier): ts.Expression {
        const parameterType = this.context.typeChecker.getTypeAtLocation(parameterDeclaration);
        const symbol = this.context.typeChecker.getSymbolAtLocation(parameterDeclaration.name);

        if (parameterType.flags & ts.TypeFlags.Object) {
            return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toWASM"), undefined, [
                ts.createIdentifier(symbol.name),
                ts.createLiteral(serializedTypeName(parameterType, this.context.typeChecker)),
                argumentObjects
            ]);
        }

        return ts.createIdentifier(symbol.name);
    }

    private serializeArgumentAndReturnTypes() {
        const types: Types = {};
        let typesToProcess = Array.from(new Set(this.argumentAndReturnTypes));

        while (typesToProcess.length > 0) {
            const type = typesToProcess.pop()!;
            const name = serializedTypeName(type, this.context.typeChecker);

            if (name in types) {
                continue;
            }

            const primitive = !!(type.flags & ts.TypeFlags.BooleanLike || type.flags & ts.TypeFlags.IntLike || type.flags & ts.TypeFlags.NumberLike);
            let fields: { name: string, type: string }[] = [];
            let typeArguments: string[] = [];
            let constructor: ts.Identifier | undefined;

            if (type.flags & ts.TypeFlags.Object) {
                const objectType = type as ts.ObjectType;
                const classReference = this.context.resolveClass(type);
                assert(classReference, "Class Reference for argument or return type " + this.context.typeChecker.typeToString(type) + " not found.");
                fields = classReference!.getFields(objectType, this.context).map(field => {
                    typesToProcess.push(field.type);
                    return {
                        name: field.name,
                        type: serializedTypeName(field.type, this.context.typeChecker)
                    }
                });

                if (objectType.objectFlags & ts.ObjectFlags.Reference && (objectType as ts.TypeReference).typeArguments) {
                    const typeReference = objectType as ts.TypeReference;
                    typesToProcess.push(...typeReference.typeArguments);
                    typeArguments.push(...typeReference.typeArguments.map(typeArgument => serializedTypeName(typeArgument, this.context.typeChecker)));
                }

                constructor = ts.createIdentifier(type.getSymbol().getName());
            }

            types[name] = {
                primitive: primitive,
                fields: fields,
                constructor: constructor,
                typeArguments: typeArguments
            };
        }

        return toLiteral(types);
    }
}

function serializedTypeName(type: ts.Type, typeChecker: TypeChecker): string {
    if (type.flags & ts.TypeFlags.BooleanLike) {
        return "i1";
    } else if (type.flags & ts.TypeFlags.IntLike) {
        return "i32";
    } else if (type.flags & ts.TypeFlags.NumberLike) {
        return "double";
    } else if (type.flags & ts.TypeFlags.Object) {
        const objectType = type as ts.ObjectType;
        let className = typeChecker.getFullyQualifiedName(type.getSymbol());

        if (objectType.objectFlags & ts.ObjectFlags.Reference && (objectType as ts.TypeReference).typeArguments) {
            const typeArguments = (objectType as ts.TypeReference).typeArguments.map(typeArgument => serializedTypeName(typeArgument, typeChecker));
            className += `<${typeArguments}>`;
        }
        return className;
    } else {
        throw new Error("Unsupported type " + typeChecker.typeToString(type));
    }
}

function toLiteral(value: any): ts.Expression {
    if (Array.isArray(value)) {
        return ts.createArrayLiteral(value.map(element => toLiteral(element)));
    } else if (typeof value === "object") {
        if (value.kind && value.flags) { // ts node
            return value as ts.Expression;
        }

        return ts.createObjectLiteral(
            Object.keys(value).map(property => {
                const propertyValue = value[property];
                return ts.createPropertyAssignment(ts.createLiteral(property), toLiteral(propertyValue));
            })
        );
    } else if (typeof value === "undefined") {
        return ts.createIdentifier("undefined");
    } else if (typeof value === "number" || typeof value === "boolean" || typeof(value) === "string") {
        return ts.createLiteral(value);
    }

    throw new Error("Unsupported value of type " + typeof(value));
}

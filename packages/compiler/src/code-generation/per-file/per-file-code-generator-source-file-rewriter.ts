import * as assert from "assert";
import * as ts from "typescript";
import {TypeChecker} from "../../type-checker";
import {CodeGenerationContext} from "../code-generation-context";
import {isMaybeObjectType} from "../util/types";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";

import {MODULE_LOADER_FACTORY_NAME, PerFileWasmLoaderEmitHelper} from "./per-file-wasm-loader-emit-helper";
import {WastMetaData} from "./wast-meta-data";

interface Types {
    [name: string]: {
        primitive: boolean,
        fields: Array<{ name: string, type: string }>,
        constructor?: ts.Identifier;
        typeArguments: string[];
    };
}

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

        const bodyStatements: ts.Statement[] = [];

        // types = { ... }
        const argumentTypes = signature.declaration.parameters.map(parameter => this.context.typeChecker.getTypeAtLocation(parameter));
        const serializedTypes = this.serializeArgumentAndReturnTypes(argumentTypes, signature.getReturnType());
        const typesIdentifier = ts.createUniqueName("types");
        const typesDeclaration = ts.createVariableStatement(undefined , [ts.createVariableDeclaration(typesIdentifier, undefined, serializedTypes)]);
        bodyStatements.push(typesDeclaration);

        let argumentObjects: ts.Identifier;
        // argumentObjects = new Map();
        if (argumentTypes.findIndex(argumentType => (argumentType.flags & ts.TypeFlags.Object) !== 0 || isMaybeObjectType(argumentType)) !== -1) {
            argumentObjects = ts.createUniqueName("argumentObjects");
            const argumentObjectsMap = ts.createNew(ts.createIdentifier("Map"), undefined, []);
            bodyStatements.push(ts.createVariableStatement(undefined, [ts.createVariableDeclaration(argumentObjects, undefined, argumentObjectsMap)]));
        } else {
            argumentObjects = ts.createIdentifier("undefined");
        }

        // const result = instance.exports.fn(args)
        const instanceIdentifier = ts.createUniqueName("instance");
        const wasmExports = ts.createPropertyAccess(instanceIdentifier, "exports");
        const targetFunction = ts.createPropertyAccess(wasmExports, name);
        const args = signature.declaration.parameters.map(parameter => this.castToWasm(
            parameter,
            this.loadWasmFunctionIdentifier!,
            typesIdentifier,
            argumentObjects)
        );

        const functionCall = ts.createCall(targetFunction, [], args);
        const castedResult = this.castToJs(functionCall, signature.getReturnType(), this.loadWasmFunctionIdentifier!, typesIdentifier);
        const resultIdentifier = ts.createUniqueName("result");
        const resultVariable = ts.createVariableDeclaration(resultIdentifier, undefined, castedResult);
        bodyStatements.push(ts.createVariableStatement(undefined, [resultVariable]));

        if (!this.context.compilationContext.compilerOptions.disableHeapNukeOnExit) {
            // speedyJsGc();
            bodyStatements.push(ts.createStatement(ts.createCall(ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"), [], [])));
        }

        bodyStatements.push(ts.createReturn(resultIdentifier));

        // function (instance) { ... }
        const instanceParameter = ts.createParameter(undefined, undefined, undefined, instanceIdentifier);
        const loadHandlerBody = ts.createBlock(bodyStatements);
        const loadedHandler = ts.createFunctionExpression(undefined, undefined, "instanceLoaded", undefined, [ instanceParameter ], undefined, loadHandlerBody);

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
            options
        ]);

        const statements = sourceFile.statements;
        const statementsToInsert = [];

        // var loadWasmModule = _moduleLoader(...);
        const loaderDeclaration = ts.createVariableDeclarationList([ts.createVariableDeclaration(this.loadWasmFunctionIdentifier, undefined, initializer)]);
        statementsToInsert.push(ts.createVariableStatement([], loaderDeclaration));

        // export let speedyJsGc = loadWasmModule_1.gc; or without export if only expose
        if (compilerOptions.exposeGc || compilerOptions.exportGc) {
            const speedyJsGcVariable = ts.createVariableDeclaration("speedyJsGc", undefined, ts.createPropertyAccess(this.loadWasmFunctionIdentifier, "gc"));
            const speedyJsGcDeclaration = ts.createVariableDeclarationList([speedyJsGcVariable], ts.NodeFlags.Const);
            const modifiers = compilerOptions.exportGc ? [ ts.createToken(ts.SyntaxKind.ExportKeyword) ] : [];
            statementsToInsert.push(ts.createVariableStatement(modifiers, speedyJsGcDeclaration));
        }

        return ts.updateSourceFileNode(sourceFile, [...statementsToInsert, ...statements]);
    }

    private castToJs(returnValue: ts.Expression, type: ts.Type, loadWasmFunctionIdentifier: ts.Identifier, typesIdentifier: ts.Identifier): ts.Expression {
        // wasm code returns 1 for true and zero for false. Cast it to a boolean
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return ts.createBinary(returnValue, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.createNumericLiteral("1"));
        }

        if (type.flags & ts.TypeFlags.Object || isMaybeObjectType(type)) {
            return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toJSObject"), undefined, [
                returnValue,
                ts.createLiteral(serializedTypeName(type, this.context.typeChecker)),
                typesIdentifier
            ]);
        }

        return returnValue;
    }

    private castToWasm(parameterDeclaration: ts.ParameterDeclaration,
                       loadWasmFunctionIdentifier: ts.Identifier,
                       typesIdentifier: ts.Identifier,
                       argumentObjects: ts.Identifier): ts.Expression {
        const parameterType = this.context.typeChecker.getTypeAtLocation(parameterDeclaration);
        const symbol = this.context.typeChecker.getSymbolAtLocation(parameterDeclaration.name);

        if (parameterType.flags & ts.TypeFlags.Object || isMaybeObjectType(parameterType)) {
            return ts.createCall(ts.createPropertyAccess(loadWasmFunctionIdentifier, "toWASM"), undefined, [
                ts.createIdentifier(symbol.name),
                ts.createLiteral(serializedTypeName(parameterType, this.context.typeChecker)),
                typesIdentifier,
                argumentObjects
            ]);
        }

        return ts.createIdentifier(symbol.name);
    }

    private serializeArgumentAndReturnTypes(argumentTypes: ts.Type[], returnType: ts.Type) {
        const types: Types = {};
        const typesToProcess = Array.from(new Set([...argumentTypes, returnType]));

        while (typesToProcess.length > 0) {
            let type = typesToProcess.pop()!;
            const name = serializedTypeName(type, this.context.typeChecker);

            if (name in types) {
                continue;
            }

            const primitive = !!(type.flags & ts.TypeFlags.BooleanLike || type.flags & ts.TypeFlags.IntLike || type.flags & ts.TypeFlags.NumberLike);
            let fields: Array<{ name: string, type: string }> = [];
            const typeArguments: string[] = [];
            let constructor: ts.Identifier | undefined;

            if (isMaybeObjectType(type)) {
                type = type.getNonNullableType();
            }

            if (type.flags & ts.TypeFlags.Object) {
                const objectType = type as ts.ObjectType;
                const classReference = this.context.resolveClass(type);
                assert(classReference, "Class Reference for argument or return type " + this.context.typeChecker.typeToString(type) + " not found.");
                fields = classReference!.getFields(objectType, this.context).map(field => {
                    typesToProcess.push(field.type);
                    return {
                        name: field.name,
                        type: serializedTypeName(field.type, this.context.typeChecker)
                    };
                });

                if (objectType.objectFlags & ts.ObjectFlags.Reference && (objectType as ts.TypeReference).typeArguments) {
                    const typeReference = objectType as ts.TypeReference;
                    typesToProcess.push(...typeReference.typeArguments);
                    typeArguments.push(...typeReference.typeArguments.map(typeArgument => serializedTypeName(typeArgument, this.context.typeChecker)));
                }

                constructor = ts.createIdentifier(type.getSymbol().getName());
            }

            types[name] = {
                primitive,
                fields,
                constructor,
                typeArguments
            };
        }

        return toLiteral(types);
    }
}

function serializedTypeName(type: ts.Type, typeChecker: TypeChecker): string {
    if (isMaybeObjectType(type)) {
        type = type.getNonNullableType();
    }

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

import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {NameMangler, Parameter} from "./name-mangler";
import {getTypeOfParentObject} from "./util/object-helper";
import {getCallSignature, isFunctionType, isMaybeObjectType} from "./util/types";
import {createResolvedFunctionFromSignature} from "./value/resolved-function";

/**
 * Base Implementation of a name mangler
 */
export abstract class BaseNameMangler implements NameMangler {

    private anonymousFunctionCounter = 0;

    constructor(protected compilationContext: CompilationContext) {
    }

    private get typeChecker() {
        return this.compilationContext.typeChecker;
    }

    /**
     * Separator between module, object and function names
     */
    protected abstract get separator(): string;

    mangleFunctionName(name: string | undefined, parameters: Parameter[], sourceFile?: ts.SourceFile): string {
        const parts = [
            this.getModulePrefix(sourceFile),
            this.getFunctionName(name, parameters)
        ];

        return parts.filter(part => !!part).join(this.separator);
    }

    mangleMethodName(clazz: ts.ObjectType, methodName: string, parameters: Parameter[], sourceFile?: ts.SourceFile): string {
        const parts = [
            this.getModulePrefix(sourceFile),
            this.getObjectName(clazz),
            this.getFunctionName(methodName, parameters)
        ];

        return parts.filter(part => !!part).join(this.separator);
    }

    mangleProperty(property: ts.PropertyAccessExpression, setter: boolean): string {
        return this.mangleAccessor(this.encodeName(property.name.text), property, setter);
    }

    mangleIndexer(element: ts.ElementAccessExpression, setter: boolean): string {
        return this.mangleAccessor(setter ? "set" : "get", element, setter);
    }

    /**
     * Returns the type code for the given parameter
     * @param parameter the parameter to encode
     * @return {string} by default, the type code of the parameter type
     */
    protected getParameterTypeCode(parameter: Parameter): string {
        return this.typeToCode(parameter.type);
    }

    /**
     * Encodes the type or function name
     * @param name the name to encode
     * @returns the encoded name
     */
    protected abstract encodeName(name: string): string;

    /**
     * Returns the module prefix to use
     */
    protected abstract getModulePrefix(sourceFile?: ts.SourceFile): string;

    private mangleAccessor(name: string, node: ts.ElementAccessExpression | ts.PropertyAccessExpression, setter: boolean): string {
        const argumentTypes: ts.Type[] = [];

        if (node.kind === ts.SyntaxKind.ElementAccessExpression) {
            argumentTypes.push(this.typeChecker.getTypeAtLocation(node.argumentExpression!));
        }

        if (setter) {
            argumentTypes.push(this.typeChecker.getTypeAtLocation(node));
        }

        const classType = getTypeOfParentObject(node, this.typeChecker)!;
        const parameters = argumentTypes.map(type => {
            return { type, variadic: false };
        });

        return this.mangleMethodName(classType, name, parameters);
    }

    private getFunctionName(name: string | undefined, parameters: Parameter[]) {
        const parameterPostfix = parameters.map(parameter => this.getParameterTypeCode(parameter)).join("");
        name = name || `$${++this.anonymousFunctionCounter}`;
        return this.encodeName(name) + parameterPostfix;
    }

    private getObjectName(objectType: ts.ObjectType) {
        const symbol = objectType.getSymbol();
        let name = symbol.getName();

        if (objectType.objectFlags & ts.ObjectFlags.Reference) {
            const referenceType = objectType as ts.TypeReference;

            if (referenceType.typeArguments && referenceType.typeArguments.length > 0) {
                name += "I";
                name += referenceType.typeArguments.map(typeArgument => this.typeToCode(typeArgument)).join("");
            }
        }

        return name;
    }

    protected typeToCode(type: ts.Type): string {
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return "b";
        }

        if (type.flags & ts.TypeFlags.IntLike) {
            return "i";
        }

        if (type.flags & ts.TypeFlags.NumberLike) {
            return "d";
        }

        if (type.flags & ts.TypeFlags.Void) {
            return "v";
        }

        if (isFunctionType(type)) {
            const signature = getCallSignature(type);
            const resolvedFunction = createResolvedFunctionFromSignature(signature, this.compilationContext);

            const parameterCodes = resolvedFunction.parameters.map(parameter => this.typeToCode(parameter.type)).join("");
            return `PF${this.typeToCode(resolvedFunction.returnType)}${parameterCodes}`;
        }

        if (isMaybeObjectType(type)) {
            return "?" + this.typeToCode(type.getNonNullableType());
        }

        if (type.flags & ts.TypeFlags.Object) {
            const objectType = type as ts.ObjectType;
            const objectName = this.encodeName(objectType.getSymbol().getName());
            let typeArgumentsPostfix = "";
            if (objectType.objectFlags & ts.ObjectFlags.Reference) {
                const typeArguments = (type as ts.TypeReference).typeArguments;

                typeArgumentsPostfix = "I" + (typeArguments || []).map(arg => this.typeToCode(arg));
            }

            return `${objectName}${typeArgumentsPostfix}`;
        }

        throw new Error(`Unsupported runtime type ${this.typeChecker.typeToString(type)}`);
    }
}

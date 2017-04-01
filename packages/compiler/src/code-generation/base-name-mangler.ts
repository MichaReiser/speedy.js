import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {NameMangler} from "./name-mangler";
import {FunctionCallArgument, FunctionCallDescription} from "./function-call-description";
import {getTypeOfParentObject} from "./util/object-helper";

/**
 * Base Implementation of a name mangler
 */
export abstract class BaseNameMangler implements NameMangler {

    constructor(private compilationContext: CompilationContext) {
    }

    private get typeChecker() {
        return this.compilationContext.typeChecker;
    }

    /**
     * Separator between module, object and function names
     */
    protected abstract get separator(): string;

    mangleFunctionName(functionCall: FunctionCallDescription): string {
        const parts = [this.getModulePrefix(functionCall.sourceFile)];

        if (functionCall.classType) {
            parts.push(this.getObjectName(functionCall.classType));
        }

        parts.push(this.getFunctionName(functionCall));

        return parts.filter(part => !!part).join(this.separator);
    }

    mangleProperty(property: ts.PropertyAccessExpression, setter: boolean): string {
        return this.mangleAccessor(this.encodeName(property.name.text), property, setter);
    }

    mangleIndexer(element: ts.ElementAccessExpression, setter: boolean): string {
        return this.mangleAccessor(setter ? "set" : "get", element, setter);
    }

    /**
     * Returns the type code for the given argument
     * @param argument the argument to encode
     * @return {string} by default, the type code of the argument type
     */
    protected getArgumentTypeCode(argument: FunctionCallArgument): string {
        return this.typeToCode(argument.type);
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
        let args: FunctionCallArgument[] = [];

        if (node.kind === ts.SyntaxKind.ElementAccessExpression) {
            args.push({
                name: "index",
                type: this.typeChecker.getTypeAtLocation(node.argumentExpression!),
                optional: false,
                variadic: false
            });
        }

        if (setter) {
            args.push({
                name,
                type: this.typeChecker.getTypeAtLocation(node),
                optional: false,
                variadic: false
            });
        }

        const classType = getTypeOfParentObject(node, this.typeChecker)!;

        return this.mangleFunctionName({
            arguments: args,
            classType,
            functionName: name,
            returnType: undefined as any,
            sourceFile: classType.getSymbol().getDeclarations()[0].getSourceFile()
        });
    }

    private getFunctionName(functionCall: FunctionCallDescription) {
        let parameterPostfix = functionCall.arguments.map(arg => this.getArgumentTypeCode(arg)).join("");
        return this.encodeName(functionCall.functionName) + parameterPostfix;
    }

    private getObjectName(objectType: ts.ObjectType) {
        const symbol = objectType.getSymbol();
        let name = symbol.getName();

        if (objectType.objectFlags & ts.ObjectFlags.Reference) {
            const referenceType = objectType as ts.TypeReference;

            if (referenceType.typeArguments.length > 0) {
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

        if (type.flags & ts.TypeFlags.Object) {
            const objectType = type as ts.ObjectType;
            const objectName = this.encodeName(objectType.getSymbol().getName());
            let typeArgumentsPostfix = "";
            if (objectType.objectFlags & ts.ObjectFlags.Reference) {
                const typeArguments = (type as ts.TypeReference).typeArguments;
                typeArgumentsPostfix = "I" + typeArguments.map(arg => this.typeToCode(arg));
            }

            return `${objectName}${typeArgumentsPostfix}`;
        }

        throw new Error(`Unsupported runtime type ${this.typeChecker.typeToString(type)}`);
    }
}


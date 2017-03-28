import * as ts from "typescript";
import * as assert from "assert";
import {getTypeOfParentObject} from "./util/object-helper";

export interface FunctionCallArgument {
    /**
     * The name of the function argument / parameter
     */
    name: string;

    /**
     * The type of the argument / parameter (for this specific function call)
     */
    type: ts.Type;

    /**
     * Initializer to use in case the optional argument value is absent
     */
    initializer?: ts.Expression;

    /**
     * Indicator if this argument is optional (and therefore, might need to be initialized with the initializer)
     */
    optional: boolean;

    /**
     * Indicator if this parameter is a vararg parameter
     */
    variadic: boolean;
}

/**
 * Description of a function call
 */
export interface FunctionCallDescription {
    /**
     * Type of the class to which the called function belongs (if it is a method, otherwise absent)
     */
    classType?: ts.ObjectType;

    /**
     * (unmangled) Name of the function
     */
    functionName: string;

    /**
     * The arguments passed to the function call.
     * Variadic arguments are aggregated to one argument with the vararg attribute set to true. This argument
     * needs to be present even if no vararg arguments are passed in this specific call.
     * Optional arguments are not included if not present in this specific call.
     */
    arguments: FunctionCallArgument[];

    /**
     * The resolved return type
     */
    returnType: ts.Type;

    /**
     * The source file in which the function is declared
     */
    sourceFile?: ts.SourceFile;
}

export function createFunctionDescriptorForCall(callExpression: ts.NewExpression | ts.CallExpression, typeChecker: ts.TypeChecker): FunctionCallDescription {
    const signature = typeChecker.getResolvedSignature(callExpression);
    return {
        arguments: getArgumentsFromCall(signature, callExpression.arguments || [], typeChecker),
        functionName: getDeclaredFunctionName(signature.declaration, typeChecker),
        classType: getObjectType(signature, callExpression, typeChecker),
        returnType: signature.getReturnType(),
        sourceFile: callExpression.getSourceFile()
    };
}

function getObjectType(signature: ts.Signature, callExpression: ts.CallExpression | ts.NewExpression, typeChecker: ts.TypeChecker): ts.ObjectType | undefined {
    if (signature.declaration.kind === ts.SyntaxKind.ConstructSignature) {
        return signature.getReturnType() as ts.ObjectType;
    }

    return getTypeOfParentObject(callExpression.expression, typeChecker);
}

function getDeclaredFunctionName(declaration: ts.SignatureDeclaration, typeChecker: ts.TypeChecker) {
    if (declaration.kind === ts.SyntaxKind.ConstructSignature) {
        return "constructor";
    } else {
        assert(declaration.name, "Anonymous functions are not supported");
        return typeChecker.getSymbolAtLocation(declaration.name!).name;
    }
}

function getArgumentsFromCall(signature: ts.Signature, args: ts.Node[], typeChecker: ts.TypeChecker) {
    let callArguments: FunctionCallArgument[] = [];

    for (let i = 0; i < signature.declaration.parameters.length; ++i) {
        const parameter = signature.declaration.parameters[i];
        const parameterSymbol = signature.parameters[i];

        if (parameter.questionToken && args.length <= i && !parameter.initializer) {
            // Optional argument that is not set... no more arguments passed in this call
            break;
        }

        const parameterType = typeChecker.getTypeOfSymbolAtLocation(parameterSymbol, parameter);

        callArguments.push({
            name: parameterSymbol.name,
            type: parameterType,
            initializer: parameter.initializer,
            optional: !!parameter.questionToken,
            variadic: !!parameter.dotDotDotToken
        });
    }

    return callArguments;
}

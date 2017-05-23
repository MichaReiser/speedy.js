import * as ts from "typescript";
import * as util from "util";
import * as assert from "assert";

/**
 * Error thrown if the code generation fails. Stores the node to show the node that  caused the error
 * in the users code.
 */
export class CodeGenerationError extends Error {
    constructor(public node: ts.Node, public code: number, message: string) {
        super(message);
        assert(node, "Node is not defined");
        assert(code, "code is not defined");
        assert(message, "message is not defined");

        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, CodeGenerationError.prototype);
    }

    toDiagnostic(): ts.Diagnostic {
        return {
            code: this.code,
            messageText: this.message,
            start: this.node.getFullStart(),
            length: this.node.getFullWidth(),
            category: ts.DiagnosticCategory.Error,
            file: this.node.getSourceFile()
        }
    }

    static builtInMethodNotSupported(propertyAccessExpression: ts.PropertyAccessExpression, objectName: string, methodName: string) {
        return CodeGenerationError.createException(propertyAccessExpression, diagnostics.BuiltInMethodNotSupported, methodName, objectName)
    }

    static builtInPropertyNotSupported(property: ts.PropertyAccessExpression, objectName: string) {
        return CodeGenerationError.createException(property, diagnostics.BuiltInPropertyNotSupported, property.name.text, objectName);
    }

    static builtInDoesNotSupportElementAccess(element: ts.ElementAccessExpression, objectName: string) {
        return CodeGenerationError.createException(element, diagnostics.BuiltInObjectDoesNotSupportElementAccess, objectName);
    }

    private static createException(node: ts.Node, diagnostic: { message: string, code: number }, ...args: (string | number)[]) {
        const message = util.format(diagnostic.message, ...args);
        return new CodeGenerationError(node, diagnostic.code, message);
    }

    static unsupportedLiteralType(node: ts.LiteralLikeNode, typeName: string) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedLiteralType, typeName);
    }

    static unsupportedType(node: ts.Declaration, typeName: string) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedType, typeName);
    }

    static unsupportedIdentifier(identifier: ts.Identifier) {
        return CodeGenerationError.createException(identifier, diagnostics.UnsupportedIdentifier, identifier.text);
    }

    static unsupportedBinaryOperation(binaryExpression: ts.BinaryExpression, leftType: string, rightType: string) {
        return CodeGenerationError.createException(binaryExpression, diagnostics.UnsupportedBinaryOperation, ts.SyntaxKind[binaryExpression.operatorToken.kind], leftType, rightType);
    }

    static unsupportedUnaryOperation(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, type: string) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedUnaryOperation, ts.SyntaxKind[node.operand.kind], type);
    }

    static anonymousEntryFunctionsNotSupported(fun: ts.FunctionDeclaration) {
        return CodeGenerationError.createException(fun, diagnostics.AnonymousEntryFunctionsUnsupported);
    }

    static optionalParametersInEntryFunctionNotSupported(optionalParameter: ts.ParameterDeclaration) {
        return CodeGenerationError.createException(optionalParameter, diagnostics.OptionalParametersNotSupportedForEntryFunction);
    }

    static genericEntryFunctionNotSupported(fun: ts.FunctionDeclaration) {
        return CodeGenerationError.createException(fun, diagnostics.GenericEntryFunctionNotSuppoorted);
    }

    static unsupportedClassReferencedBy(identifier: ts.Identifier) {
        return CodeGenerationError.createException(identifier, diagnostics.UnsupportedBuiltInClass);
    }

    static referenceToNonSpeedyJSEntryFunctionFromJS(identifier: ts.Identifier, speedyJSFunctionSymbol: ts.Symbol) {
        return CodeGenerationError.createException(identifier, diagnostics.ReferenceToNonEntrySpeedyJSFunctionFromJS, speedyJSFunctionSymbol.name);
    }

    static overloadedEntryFunctionNotSupported(fun: ts.FunctionDeclaration) {
        return CodeGenerationError.createException(fun, diagnostics.OverloadedEntryFunctionNotSupported);
    }

    static unsupportedSyntaxKind(node: ts.Node) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedSyntaxKind, ts.SyntaxKind[node.kind]);
    }

    static unsupportedProperty(propertyExpression: ts.PropertyAccessExpression) {
        return CodeGenerationError.createException(propertyExpression, diagnostics.UnsupportedProperty);
    }

    static unsupportedIndexer(node: ts.ElementAccessExpression) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedIndexer);
    }

    static unsupportedCast(node: ts.AsExpression, sourceType: string, targetType: string) {
        return CodeGenerationError.createException(node, diagnostics.UnsupportedCast, sourceType, targetType);
    }

    static implicitArrayElementCast(element: ts.Expression, arrayElementType: string, typeOfElementRequiringImplicitCast: string) {
        return CodeGenerationError.createException(element, diagnostics.UnsupportedImplicitArrayElementCast, typeOfElementRequiringImplicitCast, arrayElementType);
    }

    static unsupportedImplicitCastOfBinaryExpressionOperands(binaryExpression: ts.BinaryExpression, leftOperandType: string, rightOperandType: string) {
        return CodeGenerationError.createException(binaryExpression, diagnostics.UnsupportedImplicitCastOfBinaryExpressionOperands, leftOperandType, rightOperandType);
    }

    static unsupportedImplicitCastOfArgument(elementNotMatchingArrayElementType: ts.Expression, parameterType: string, argumentType: string) {
        return CodeGenerationError.createException(elementNotMatchingArrayElementType, diagnostics.UnsupportedImplicitCastOfArgument, argumentType, parameterType, parameterType);
    }
}

const diagnostics = {
    "BuiltInMethodNotSupported": {
        message: "The method '%s' of the built in object '%s' is not supported",
        code: 100000
    },
    "BuiltInPropertyNotSupported": {
        message: "The property '%s' of the built in object '%s' is not supported",
        code: 100001
    },
    "BuiltInObjectDoesNotSupportElementAccess": {
        message: "The built in object '%s' does not support element access (%s[index] or $s[index]=value)",
        code: 100002
    },
    UnsupportedBuiltInClass: {
        message: "The class referenced by this identifier is not supported",
        code: 100003,
    },
    "UnsupportedLiteralType": {
        message: "The literal type '%s' is not supported",
        code: 100004
    },
    "UnsupportedType": {
        message: "The type '%s' is not supported",
        code: 100005
    },
    "UnsupportedIdentifier": {
        message: "Unsupported type or kind of identifier '%s'",
        code: 100006
    },
    "UnsupportedBinaryOperation": {
        message: "The binary operator %s is not supported for the left and right hand side types '%s' '%s'",
        code: 100007
    },
    UnsupportedUnaryOperation: {
        message: "The unary operator %s is not supported for the type '%s'",
        code: 100008
    },
    AnonymousEntryFunctionsUnsupported: {
        message: "SpeedyJS entry functions need to have a name",
        code: 100009
    },
    ReferenceToNonEntrySpeedyJSFunctionFromJS: {
        message: "SpeedyJS functions referenced from 'normal' JavaScript code needs to be async (the async modifier is missing on the declaration of '%s').",
        code: 100010
    },
    OptionalParametersNotSupportedForEntryFunction: {
        message: "Optional parameters or variadic parameters are not supported for SpeedyJS entry functions",
        code: 100011
    },
    GenericEntryFunctionNotSuppoorted: {
        message: "Generic SpeedyJS entry functions are not supported",
        code: 100012
    },
    OverloadedEntryFunctionNotSupported: {
        message: "SpeedyJS entry function cannot be overloaded",
        code: 100013
    },
    UnsupportedSyntaxKind: {
        message: "The syntax kind '%s' is not yet supported.",
        code: 100014
    },
    UnsupportedProperty: {
        message: "The kind of property is not yet supported",
        code: 1000015
    },
    UnsupportedIndexer: {
        message: "The kind of indexer is not yet supported",
        code: 1000016
    },
    UnsupportedCast: {
        message: "Casting from '%s' to '%s' is not yet supported",
        code: 1000017
    },
    UnsupportedImplicitArrayElementCast: {
        message: "The array element of type '%s' requires an implicit cast to the array element type '%s'. Implicit casts are not supported. An explicit cast of the element to the array element type is required.",
        code: 1000018
    },
    UnsupportedImplicitCastOfBinaryExpressionOperands: {
        message: "Unsupported implicit cast of binary expressions operands (left: %s, right: %s). An explicit cast of either of the operands to the other's type is required.",
        code: 1000019
    },
    UnsupportedImplicitCastOfArgument: {
        message: "Unsupported implicit cast of the argument with the type '%s' to the expected parameter type '%s'. An explicit cast of the argument to the type '%s' is required.",
        code: 1000020
    }
};

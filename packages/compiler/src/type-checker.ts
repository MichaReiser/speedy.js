import * as ts from "typescript";

/**
 * Abstraction of the type checker
 * @see ts.TypeChecker
 */
export interface TypeChecker {
    getAliasedSymbol(symbol: ts.Symbol): ts.Symbol;
    getTypeAtLocation(node: ts.Node): ts.Type;
    getContextualType(node: ts.Expression): ts.Type;
    getTypeOfSymbolAtLocation(symbol: ts.Symbol, location: ts.Node): ts.Type;
    getResolvedSignature(callLikeExpression: ts.CallLikeExpression): ts.Signature;
    typeToString(type: ts.Type): string;
    getSymbolAtLocation(name: ts.Node): ts.Symbol;
    getFullyQualifiedName(symbol: ts.Symbol): string;
    getSignatureFromDeclaration(functionDeclaration: ts.SignatureDeclaration): ts.Signature;
    getDeclaredTypeOfSymbol(symbol: ts.Symbol): ts.Type;
    getSignaturesOfType(type: ts.Type, Call: ts.SignatureKind): ts.Signature[];
    getReturnTypeOfSignature(signature: ts.Signature): ts.Type;
    getApparentType(type: ts.Type): ts.Type;
    isImplementationOfOverload(fun: ts.FunctionLikeDeclaration): boolean;

    /**
     * Tests if the passed in types are are equal.
     * @param first the first type to test
     * @param second the second type to test
     */
    isAssignableTo(first: ts.Type, second: ts.Type): boolean;

    /**
     * Takes a type script type and converts it to a supported variant of it
     * @param type the type to convert
     */
    toSupportedType(type: ts.Type): ts.Type;
}

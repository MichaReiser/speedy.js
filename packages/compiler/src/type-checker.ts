import * as ts from "typescript";

export interface TypeChecker {
    getTypeAtLocation(node: ts.Node): ts.Type;
    getContextualType(node: ts.Expression): ts.Type;
    getTypeOfSymbolAtLocation(symbol: ts.Symbol, location: ts.Node): ts.Type;
    getResolvedSignature(callLikeExpression: ts.CallLikeExpression): ts.Signature;
    typeToString(type: ts.Type): string;
    getSymbolAtLocation(name: ts.Node): ts.Symbol;
    getFullyQualifiedName(symbol: ts.Symbol): string;
    getSignatureFromDeclaration(functionDeclaration: ts.FunctionDeclaration): ts.Signature;
    getDeclaredTypeOfSymbol(symbol: ts.Symbol): ts.Type;
    getSignaturesOfType(type: ts.Type, Call: ts.SignatureKind): ts.Signature[];
}

import * as ts from "typescript";
import {TypeChecker} from "./type-checker";

export class TypeScriptTypeChecker implements TypeChecker {
    constructor(private tsTypeChecker: ts.TypeChecker) {}

    getSignaturesOfType(type: ts.Type, kind: ts.SignatureKind): ts.Signature[] {
        return this.tsTypeChecker.getSignaturesOfType(type, kind);
    }

    getDeclaredTypeOfSymbol(symbol: ts.Symbol): ts.Type {
        return toSupportedType(this.tsTypeChecker.getDeclaredTypeOfSymbol(symbol));
    }

    getSymbolAtLocation(node: ts.Node): ts.Symbol {
        return this.tsTypeChecker.getSymbolAtLocation(node);
    }

    getFullyQualifiedName(symbol: ts.Symbol): string {
        return this.tsTypeChecker.getFullyQualifiedName(symbol);
    }

    getSignatureFromDeclaration(functionDeclaration: ts.FunctionDeclaration): ts.Signature {
        return new SignatureWrapper(this.tsTypeChecker.getSignatureFromDeclaration(functionDeclaration));
    }

    getTypeAtLocation(node: ts.Node): ts.Type {
        return toSupportedType(this.tsTypeChecker.getTypeAtLocation(node));
    }

    getContextualType(node: ts.Expression): ts.Type {
        return toSupportedType(this.tsTypeChecker.getContextualType(node));
    }

    typeToString(type: ts.Type): string {
        return this.tsTypeChecker.typeToString(type);
    }

    getTypeOfSymbolAtLocation(symbol: ts.Symbol, location: ts.Node): ts.Type {
        return toSupportedType(this.tsTypeChecker.getTypeOfSymbolAtLocation(symbol, location));
    }

    getResolvedSignature(callLikeExpression: ts.CallLikeExpression): ts.Signature {
        return new SignatureWrapper(this.tsTypeChecker.getResolvedSignature(callLikeExpression));
    }
}

function toSupportedType(type: ts.Type) {
    return type.getNonNullableType();
}

class SignatureWrapper implements ts.Signature {
    constructor(private signature: ts.Signature) {

    }

    get declaration() {
        return this.signature.declaration;
    }

    get typeParameters() {
        return this.signature.typeParameters;
    }

    get parameters() {
        return this.signature.parameters;
    }

    getDeclaration() {
        return this.signature.getDeclaration();
    }

    getTypeParameters() {
        return this.signature.getTypeParameters();
    }

    getParameters(): ts.Symbol[] {
        return this.signature.getParameters();
    }

    getReturnType(): ts.Type {
        return toSupportedType(this.signature.getReturnType());
    }

    getDocumentationComment(): ts.SymbolDisplayPart[] {
        return this.signature.getDocumentationComment();
    }
}

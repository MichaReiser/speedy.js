import * as ts from "typescript";
import {TypeChecker} from "./type-checker";

/**
 * Wrapper of the type script type checker.
 * It mainly gets rid of all nullable types. If nullable types are supported, than the unwrapping
 * of nullable types should be removed.
 */
export class TypeScriptTypeChecker implements TypeChecker {

    constructor(private tsTypeChecker: ts.TypeChecker) {}

    getAliasedSymbol(symbol: ts.Symbol): ts.Symbol {
        return this.tsTypeChecker.getAliasedSymbol(symbol);
    }

    getApparentType(type: ts.Type): ts.Type {
        return this.toSupportedType(this.tsTypeChecker.getApparentType(type));
    }

    getSignaturesOfType(type: ts.Type, kind: ts.SignatureKind): ts.Signature[] {
        return this.tsTypeChecker.getSignaturesOfType(type, kind);
    }

    getReturnTypeOfSignature(signature: ts.Signature): ts.Type {
        return this.toSupportedType(this.tsTypeChecker.getReturnTypeOfSignature(signature));
    }

    getDeclaredTypeOfSymbol(symbol: ts.Symbol): ts.Type {
        return this.toSupportedType(this.tsTypeChecker.getDeclaredTypeOfSymbol(symbol));
    }

    getSymbolAtLocation(node: ts.Node): ts.Symbol {
        return this.tsTypeChecker.getSymbolAtLocation(node);
    }

    getFullyQualifiedName(symbol: ts.Symbol): string {
        return this.tsTypeChecker.getFullyQualifiedName(symbol);
    }

    getSignatureFromDeclaration(functionDeclaration: ts.FunctionDeclaration): ts.Signature {
        return new SignatureWrapper(this.tsTypeChecker.getSignatureFromDeclaration(functionDeclaration), this.tsTypeChecker);
    }

    getTypeAtLocation(node: ts.Node): ts.Type {
        let type = this.toSupportedType(this.tsTypeChecker.getTypeAtLocation(node));

        // e.g. when const x: int[] = [] then the type of [] is never[] that is quite unfortunate. Take the contextual
        // type information into consideration in this case (but do not otherwise. Otherwise let x: number = 3 returns unexpected results.
        if (type.flags & ts.TypeFlags.Object && (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
            const typeReference = type as ts.TypeReference;

            if (typeReference.typeArguments && typeReference.typeArguments.some(typeArgument => !!(typeArgument.flags & ts.TypeFlags.Never))) {
                type = this.toSupportedType(this.getContextualType(node as ts.Expression)) || type;
            }
        }

        return type;
    }

    getContextualType(node: ts.Expression): ts.Type {
        return this.toSupportedType(this.tsTypeChecker.getContextualType(node));
    }

    typeToString(type: ts.Type): string {
        return this.tsTypeChecker.typeToString(type);
    }

    getTypeOfSymbolAtLocation(symbol: ts.Symbol, location: ts.Node): ts.Type {
        return this.toSupportedType(this.tsTypeChecker.getTypeOfSymbolAtLocation(symbol, location));
    }

    getResolvedSignature(callLikeExpression: ts.CallLikeExpression): ts.Signature {
        return new SignatureWrapper(this.tsTypeChecker.getResolvedSignature(callLikeExpression), this.tsTypeChecker);
    }

    isImplementationOfOverload(fun: ts.FunctionLikeDeclaration): boolean {
        return this.tsTypeChecker.isImplementationOfOverload(fun);
    }

    toSupportedType(type: ts.Type): ts.Type {
        return toSupportedType(type, this.tsTypeChecker);
    }

    isUndefinedSymbol(symbol: ts.Symbol) {
        return this.tsTypeChecker.isUndefinedSymbol(symbol);
    }
}

function toSupportedType(type: ts.Type, typeChecker: ts.TypeChecker): ts.Type {
    // should never happen but it does!, thanks typescript
    if (typeof(type) === "undefined") {
        return type;
    }

    // e.g. 1, 2... we are not interested in the literals, only in the type
    if (type.flags & ts.TypeFlags.Literal) {
        return typeChecker.getBaseTypeOfLiteralType(type);
    }

    // e.g. 1 | 2. We are not interested in the actual literals, just what the type is.
    if (type.flags & ts.TypeFlags.Union) {
        const unionType = type as ts.UnionType;
        const intLiterals = unionType.types.every(t => !!(t.flags & ts.TypeFlags.IntLike));
        const numberLiterals = unionType.types.every(t => !!(t.flags & ts.TypeFlags.NumberLike) && !(t.flags & ts.TypeFlags.IntLike));
        const booleanLiterals = unionType.types.every(t => !!(t.flags & ts.TypeFlags.BooleanLike));

        if ((intLiterals || numberLiterals || booleanLiterals) && unionType.types.length > 0) {
            return toSupportedType(unionType.types[0], typeChecker);
        }
    }

    if (type.flags & ts.TypeFlags.Union) {
        const unionType = type as ts.UnionType;
        const isMaybeType = unionType.types.length === 2 && unionType.types.some(t => !!(t.flags & ts.TypeFlags.Undefined));

        // e.g. double | undefined, int | undefined, boolean | undefined are not supported. Compiler does not allow undefined values of
        // primitive types (yet). Maybe in the future when union types are fully supported. So until then, just return the non nullable type
        if (isMaybeType && unionType.types.some(t => !!(t.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike)))) {
            return unionType.getNonNullableType();
        }
    }

    return type;
}

class SignatureWrapper implements ts.Signature {

    constructor(private signature: ts.Signature, private typeChecker: ts.TypeChecker) {
    }

    getJsDocTags(): ts.JSDocTagInfo[] {
        return this.signature.getJsDocTags();
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
        let returnType = this.signature.getReturnType();

        // if is Promise<T>
        if (returnType.getSymbol() &&
            returnType.getSymbol().getName()  === "Promise" &&
            returnType.flags & ts.TypeFlags.Object &&
            (returnType as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {

            const typeReference = returnType as ts.TypeReference;
            returnType = typeReference.typeArguments && typeReference.typeArguments.length === 1 ? typeReference.typeArguments[0] : returnType;
        }

        return toSupportedType(returnType, this.typeChecker);
    }

    getDocumentationComment(): ts.SymbolDisplayPart[] {
        return this.signature.getDocumentationComment();
    }
}

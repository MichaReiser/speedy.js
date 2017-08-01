import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";

import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Undefined} from "../value/undefined";
import {UnresolvedFunctionReference} from "../value/unresolved-function-reference";
import {Value} from "../value/value";

class IdentifierCodeGenerator implements SyntaxCodeGenerator<ts.Identifier, Value> {
    syntaxKind = ts.SyntaxKind.Identifier;

    generate(identifier: ts.Identifier, context: CodeGenerationContext): Value {
        let symbol = context.typeChecker.getSymbolAtLocation(identifier);

        if (symbol.flags & ts.SymbolFlags.Alias) {
            symbol = context.typeChecker.getAliasedSymbol(symbol);
        }

        if (context.typeChecker.isUndefinedSymbol(symbol)) {
            return Undefined.create(context);
        }

        if (symbol.flags & ts.SymbolFlags.Function) {
            return IdentifierCodeGenerator.getFunction(symbol, identifier, context);
        }

        if (symbol.flags & ts.SymbolFlags.Variable && context.scope.hasVariable(symbol)) {
            return context.scope.getVariable(symbol);
        }

        if (symbol.flags & ts.SymbolFlags.Type) {
            const classType = context.typeChecker.getDeclaredTypeOfSymbol(symbol);
            const classReference = context.resolveClass(classType, symbol);
            if (classReference) {
                return classReference;
            }
        }

        throw CodeGenerationDiagnostics.unsupportedIdentifier(identifier);
    }

    private static getFunction(symbol: ts.Symbol, identifier: ts.Identifier, context: CodeGenerationContext) {
        if (context.scope.hasFunction(symbol)) {
            return context.scope.getFunction(symbol);
        }

        const type = context.typeChecker.getTypeAtLocation(identifier);
        const apparentType = context.typeChecker.getApparentType(type);
        const callSignatures = context.typeChecker.getSignaturesOfType(apparentType, ts.SignatureKind.Call);

        return UnresolvedFunctionReference.createFunction(callSignatures, context);
    }
}

export default IdentifierCodeGenerator;

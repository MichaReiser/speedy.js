import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../../code-generation-error";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Allocation} from "../value/allocation";
import {ClassReference} from "../value/class-reference";
import {FunctionReference} from "../value/function-reference";
import {UnresolvedFunctionReference} from "../value/unresolved-function-reference";

class IdentifierCodeGenerator implements SyntaxCodeGenerator<ts.Identifier, FunctionReference | Allocation | ClassReference> {
    syntaxKind = ts.SyntaxKind.Identifier;

    generate(identifier: ts.Identifier, context: CodeGenerationContext): FunctionReference | Allocation | ClassReference {
        const symbol = context.typeChecker.getSymbolAtLocation(identifier);

        if (symbol.flags & ts.SymbolFlags.Function) {
            return this.getFunction(symbol, identifier, context);
        }

        if (symbol.flags & ts.SymbolFlags.Variable && context.scope.hasVariable(symbol)) {
            return context.scope.getVariable(symbol);
        }

        if (symbol.flags & ts.SymbolFlags.Type) {
            if (!context.scope.hasClass(symbol)) {
                throw CodeGenerationError.unsupportedClassReferencedBy(identifier)
            }
            return context.scope.getClass(symbol);
        }

        throw CodeGenerationError.unsupportedIdentifier(identifier);
    }

    private getFunction(symbol: ts.Symbol, identifier: ts.Identifier, context: CodeGenerationContext) {
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

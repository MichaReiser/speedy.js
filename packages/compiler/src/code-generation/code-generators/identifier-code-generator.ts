import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../code-generation-error";
import {FunctionReference} from "../value/function-reference";
import {ClassReference} from "../value/class-reference";
import {Allocation} from "../value/allocation";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class IdentifierCodeGenerator implements SyntaxCodeGenerator<ts.Identifier, FunctionReference | Allocation | ClassReference> {
    syntaxKind = ts.SyntaxKind.Identifier;

    generate(identifier: ts.Identifier, context: CodeGenerationContext): FunctionReference | Allocation | ClassReference {
        const symbol = context.typeChecker.getSymbolAtLocation(identifier);

        if (symbol.flags & ts.SymbolFlags.Function) {
            return context.scope.getFunction(symbol);
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
}

export default IdentifierCodeGenerator;

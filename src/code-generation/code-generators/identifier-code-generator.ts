import * as ts from "typescript";
import * as llvm from "llvm-node";

import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class IdentifierCodeGenerator implements ValueSyntaxCodeGenerator<ts.Identifier> {
    syntaxKind = ts.SyntaxKind.Identifier;

    generateValue(identifier: ts.Identifier, context: CodeGenerationContext): llvm.Value | llvm.Function {
        const symbol = context.typeChecker.getSymbolAtLocation(identifier);

        if (symbol.flags  === ts.SymbolFlags.Function) {
            return context.scope.getFunction(symbol);
        }

        return context.builder.createLoad(context.scope.getVariable(symbol), symbol.name);
    }

    generate(node: ts.Identifier, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default IdentifierCodeGenerator;

import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class ExpressionStatementCodeGenerator implements SyntaxCodeGenerator<ts.ExpressionStatement, void> {
    syntaxKind = ts.SyntaxKind.ExpressionStatement;

    generate(node: ts.ExpressionStatement, context: CodeGenerationContext): void {
        context.generate(node.expression);
    }
}

export default ExpressionStatementCodeGenerator;

import * as ts from "typescript";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class ExpressionStatementCodeGenerator implements ValueSyntaxCodeGenerator<ts.ExpressionStatement> {
    syntaxKind = ts.SyntaxKind.ExpressionStatement;

    generate(node: ts.ExpressionStatement, context: CodeGenerationContext): void {
        context.generateVoid(node.expression);
    }

    generateValue(node: ts.ExpressionStatement, context: CodeGenerationContext): llvm.Value {
        return context.generate(node.expression);
    }
}

export default ExpressionStatementCodeGenerator;

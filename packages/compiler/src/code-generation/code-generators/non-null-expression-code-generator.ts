import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";

class NonNullExpressionCodeGenerator implements SyntaxCodeGenerator<ts.NonNullExpression, void | Value> {
    syntaxKind = ts.SyntaxKind.NonNullExpression;

    generate(node: ts.NonNullExpression, context: CodeGenerationContext): void | Value {
        return context.generate(node.expression);
    }
}

export default NonNullExpressionCodeGenerator;

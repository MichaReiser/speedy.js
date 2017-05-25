import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";

/**
 * Code Generator for paranthesized expressions
 * @code 3 * (1 + 4)
 */
class ParanthesizedExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ParenthesizedExpression, Value> {
    syntaxKind = ts.SyntaxKind.ParenthesizedExpression;

    generate(expression: ts.ParenthesizedExpression, context: CodeGenerationContext): Value {
        return context.generateValue(expression.expression);
    }
}

export default ParanthesizedExpressionCodeGenerator;

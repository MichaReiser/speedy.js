import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Generator for await xy expressions.
 * The current implementation does not support async execution. Therefore, the async keyword is simply ignored
 */
class AwaitExpressionCodeGenerator implements SyntaxCodeGenerator<ts.AwaitExpression, Value> {
    syntaxKind = ts.SyntaxKind.AwaitExpression;

    generate(node: ts.AwaitExpression, context: CodeGenerationContext): Value {
        return context.generateValue(node.expression);
    }
}

export default AwaitExpressionCodeGenerator;

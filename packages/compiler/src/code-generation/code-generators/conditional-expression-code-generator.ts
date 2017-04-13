import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";
import {Value} from "../value/value";

/**
 * Code Generator for condition expressions (condition ? whenTrue : whenFalse);
 */
class ConditionalExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ConditionalExpression, Value> {
    syntaxKind = ts.SyntaxKind.ConditionalExpression;

    generate(node: ts.ConditionalExpression, context: CodeGenerationContext): Value {
        const condition = context.generateValue(node.condition);
        const conditionBool = Primitive.toBoolean(condition.generateIR(context), context.typeChecker.getTypeAtLocation(node.condition), context);
        const whenTrue = context.generateValue(node.whenTrue);
        const whenFalse = context.generateValue(node.whenFalse);

        const result = context.builder.createSelect(conditionBool, whenTrue.generateIR(context), whenFalse.generateIR(context), "cond");
        return context.value(result, context.typeChecker.getTypeAtLocation(node));
    }
}

export default ConditionalExpressionCodeGenerator;

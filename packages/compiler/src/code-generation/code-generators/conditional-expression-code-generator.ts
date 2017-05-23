import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";
import {Value} from "../value/value";
import {CodeGenerationError} from "../../code-generation-error";

/**
 * Code Generator for condition expressions (condition ? whenTrue : whenFalse);
 */
class ConditionalExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ConditionalExpression, Value> {
    syntaxKind = ts.SyntaxKind.ConditionalExpression;

    generate(node: ts.ConditionalExpression, context: CodeGenerationContext): Value {
        const whenTrueType = context.typeChecker.getTypeAtLocation(node.whenTrue);
        const whenFalseType = context.typeChecker.getTypeAtLocation(node.whenFalse);
        const conditionalType = context.typeChecker.getTypeAtLocation(node);

        if (!context.typeChecker.areEqualTypes(conditionalType, whenTrueType)) {
            throw CodeGenerationError.unsupportedImplicitCastOfConditionalResult(node.whenTrue, context.typeChecker.typeToString(conditionalType), context.typeChecker.typeToString(whenTrueType));
        }

        if (!context.typeChecker.areEqualTypes(conditionalType, whenFalseType)) {
            throw CodeGenerationError.unsupportedImplicitCastOfConditionalResult(node.whenTrue, context.typeChecker.typeToString(conditionalType), context.typeChecker.typeToString(whenFalseType));
        }

        const condition = context.generateValue(node.condition);
        const conditionBool = Primitive.toBoolean(condition.generateIR(context), context.typeChecker.getTypeAtLocation(node.condition), context);

        const whenTrue = context.generateValue(node.whenTrue);
        const whenFalse = context.generateValue(node.whenFalse);

        const result = context.builder.createSelect(conditionBool, whenTrue.generateIR(context), whenFalse.generateIR(context), "cond");
        return context.value(result, context.typeChecker.getTypeAtLocation(node));
    }
}

export default ConditionalExpressionCodeGenerator;

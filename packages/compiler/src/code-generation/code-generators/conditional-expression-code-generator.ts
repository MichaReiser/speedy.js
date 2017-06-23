import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";
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
        const whenTrueType = context.typeChecker.getTypeAtLocation(node.whenTrue);
        const whenFalseType = context.typeChecker.getTypeAtLocation(node.whenFalse);
        const conditionalType = context.typeChecker.getTypeAtLocation(node);

        const condition = context.generateValue(node.condition);
        const conditionBool = Primitive.toBoolean(condition, context.typeChecker.getTypeAtLocation(node.condition), context);

        const whenTrue = context.generateValue(node.whenTrue).castImplicit(conditionalType, context);
        const whenFalse = context.generateValue(node.whenFalse).castImplicit(conditionalType, context);

        const conditionalTypeName = context.typeChecker.typeToString(conditionalType);
        if (!whenFalse) {
            const whenFalseTypeName = context.typeChecker.typeToString(whenFalseType);
            throw CodeGenerationDiagnostics.unsupportedImplicitCastOfConditionalResult(node.whenFalse, conditionalTypeName, whenFalseTypeName);
        }

        if (!whenTrue) {
            const whenTrueTypeName = context.typeChecker.typeToString(whenTrueType);
            throw CodeGenerationDiagnostics.unsupportedImplicitCastOfConditionalResult(node.whenTrue, conditionalTypeName, whenTrueTypeName);
        }

        const result = context.builder.createSelect(conditionBool, whenTrue.generateIR(context), whenFalse.generateIR(context), "cond");
        return context.value(result, context.typeChecker.getTypeAtLocation(node));
    }
}

export default ConditionalExpressionCodeGenerator;

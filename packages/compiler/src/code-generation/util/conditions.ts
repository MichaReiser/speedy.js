import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";

/**
 * Generates a condition statement that takes the whenTrue branch if the condition evaluates to a truthy value and to the whenFalse branch otherwise.
 * The implementation optimizes conditions. E.g. && and || are optimized to not store the value and instead just evaluate
 * if the expression is truthy (the value is not needed)
 * @param condition
 * @param whenTrue
 * @param whenFalse
 * @param context
 */
export function generateCondition(condition: ts.Node, whenTrue: llvm.BasicBlock, whenFalse: llvm.BasicBlock, context: CodeGenerationContext): void {
    if (condition.kind === ts.SyntaxKind.ParenthesizedExpression) {
        return generateCondition((condition as ts.ParenthesizedExpression).expression, whenTrue, whenFalse, context);
    }

    if (condition.kind === ts.SyntaxKind.BinaryExpression) {
        const binaryExpression = condition as ts.BinaryExpression;

        // x && y
        if (binaryExpression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
            let rhsBlock = llvm.BasicBlock.create(context.llvmContext, "land.lhs.true");
            generateCondition(binaryExpression.left, rhsBlock, whenFalse, context);

            context.scope.enclosingFunction.addBasicBlock(rhsBlock);
            context.builder.setInsertionPoint(rhsBlock);
            generateCondition(binaryExpression.right, whenTrue, whenFalse, context);
            return;

        } else if (binaryExpression.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            let rhsBlock = llvm.BasicBlock.create(context.llvmContext, "lor.lhs.false");
            generateCondition(binaryExpression.left, whenTrue, rhsBlock, context);

            context.scope.enclosingFunction.addBasicBlock(rhsBlock);
            context.builder.setInsertionPoint(rhsBlock);
            generateCondition(binaryExpression.right, whenTrue, whenFalse, context);
            return;
        }
    } else if (condition.kind === ts.SyntaxKind.PrefixUnaryExpression) {
        const unaryExpression = condition as ts.PrefixUnaryExpression;

        if (unaryExpression.operator === ts.SyntaxKind.ExclamationToken) {
            generateCondition(unaryExpression.operand, whenFalse, whenTrue, context);
            return;
        }
    }

    // Not specially optimized case
    const conditionValue = context.generateValue(condition);
    const conditionBoolValue = Primitive.toBoolean(conditionValue, context.typeChecker.getTypeAtLocation(condition), context);
    context.builder.createCondBr(conditionBoolValue, whenTrue, whenFalse);
}

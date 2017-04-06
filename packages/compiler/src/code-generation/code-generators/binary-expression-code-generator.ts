import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value} from "../value/value";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationError} from "../../code-generation-error";
import {MathObjectReference} from "../value/math-object-reference";
import {Primitive} from "../value/primitive";
import {Allocation} from "../value/allocation";

function isAssignment(operatorToken: ts.BinaryOperatorToken) {
    return operatorToken.kind === ts.SyntaxKind.EqualsToken ||
        operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.MinusEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.AsteriskEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.SlashEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.PercentEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.AmpersandEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.BarEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.CaretEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.LessThanLessThanEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
        operatorToken.kind === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken;
}

/**
 * Code Generator for binary expressions, e.g. 5+3 but also x = 3, or x += 3
 */
class BinaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.BinaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.BinaryExpression;

    generate(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(binaryExpression.left);
        const right = context.generateValue(binaryExpression.right);
        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);
        const resultType = context.typeChecker.getTypeAtLocation(binaryExpression);

        let result: llvm.Value | undefined;

        switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createMul(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFMul(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.AsteriskAsteriskToken:
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.NumberLike)) {
                    result = MathObjectReference.pow(left, right, resultType, context).generateIR(context);
                }

                break;

            case ts.SyntaxKind.BarToken:
            case ts.SyntaxKind.BarEqualsToken:
                const intType = resultType;
                const lhsIntValue = Primitive.toInt32(left, leftType, intType, context).generateIR();
                const rhsIntValue = Primitive.toInt32(right, rightType, intType, context).generateIR();
                result = context.builder.createOr(lhsIntValue, rhsIntValue);

                break;

            case ts.SyntaxKind.BarBarToken:
                const orResult = Allocation.createInEntryBlock(resultType, context, "orResult");
                const leftValue = left.generateIR(context);
                orResult.generateAssignmentIR(leftValue, context);

                const falseBlock = llvm.BasicBlock.create(context.llvmContext, "orCase");
                const successorBlock = llvm.BasicBlock.create(context.llvmContext, "orSuccessor");
                const firstTrue = Primitive.toBoolean(leftValue, leftType, context);

                context.builder.createCondBr(firstTrue, successorBlock, falseBlock);

                context.scope.enclosingFunction.addBasicBlock(falseBlock);
                context.builder.setInsertionPoint(falseBlock);

                orResult.generateAssignmentIR(right, context);
                context.builder.createBr(successorBlock);

                context.scope.enclosingFunction.addBasicBlock(successorBlock);
                context.builder.setInsertionPoint(successorBlock);

                result = orResult.generateIR(context);
                break;

            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpEQ(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOEQ(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.ExclamationEqualsEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpNE(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpONE(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.GreaterThanToken:
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSGT(context.builder.createZExt(left.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(right.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)));
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSGT(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGT(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.GreaterThanEqualsToken:
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSGE(context.builder.createZExt(left.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(right.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)));
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSGE(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGE(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.LessThanToken: {
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSLT(context.builder.createZExt(left.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(right.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)));
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLT(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULT(left.generateIR(context), right.generateIR(context));
                }

                break;
            }

            case ts.SyntaxKind.LessThanEqualsToken:
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSLE(context.builder.createZExt(left.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(right.generateIR(context), llvm.Type.getInt32Ty(context.llvmContext)));
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLE(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULE(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.PercentToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSRem(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFRem(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(left.generateIR(context), right.generateIR(context));
                }

                break;

            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSDiv(left.generateIR(context), right.generateIR(context));
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFDiv(left.generateIR(context), right.generateIR(context));
                }

                break;
            }

            case ts.SyntaxKind.FirstAssignment:
                result = right.generateIR(context);
        }

        if (!result) {
            throw CodeGenerationError.unsupportedBinaryOperation(binaryExpression, context.typeChecker.typeToString(leftType), context.typeChecker.typeToString(leftType));
        }

        const resultValue = context.value(result, resultType);

        if (isAssignment(binaryExpression.operatorToken)) {
            context.assignValue(left, resultValue);
        }

        return resultValue;
    }
}

export default BinaryExpressionCodeGenerator;

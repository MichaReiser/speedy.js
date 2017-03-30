import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value} from "../value/value";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationError} from "../code-generation-error";
import {MathObjectReference} from "../value/math-object-reference";

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
        const rightLLVMValue = right.generateIR();

        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);

        let result: llvm.Value | undefined;

        switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createMul(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFMul(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.AsteriskAsteriskToken:
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.NumberLike)) {
                    result = MathObjectReference.pow(left.generateIR(), rightLLVMValue, leftType, context);
                }

                break;

            case ts.SyntaxKind.BarToken:
            case ts.SyntaxKind.BarEqualsToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createOr(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFPToSI(left.generateIR(), llvm.Type.getInt32Ty(context.llvmContext));
                }

                break;

            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpEQ(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOEQ(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.GreaterThanToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpSGT(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGT(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.GreaterThanEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpSGE(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGE(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.LessThanToken: {
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpSLT(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULT(left.generateIR(), rightLLVMValue);
                }

                break;
            }

            case ts.SyntaxKind.LessThanEqualsToken:
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike)) {
                    result = context.builder.createICmpSLE(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULE(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.PercentToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSRem(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFRem(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(left.generateIR(), rightLLVMValue);
                }

                break;

            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSDiv(left.generateIR(), rightLLVMValue);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFDiv(left.generateIR(), rightLLVMValue);
                }

                break;
            }

            case ts.SyntaxKind.FirstAssignment:
                result = rightLLVMValue;
        }

        if (!result) {
            throw CodeGenerationError.unsupportedBinaryOperation(binaryExpression, context.typeChecker.typeToString(leftType), context.typeChecker.typeToString(leftType));
        }

        const resultValue = context.value(result, rightType);

        if (isAssignment(binaryExpression.operatorToken)) {
            context.assignValue(left, resultValue);
        }

        return resultValue;
    }
}

export default BinaryExpressionCodeGenerator;

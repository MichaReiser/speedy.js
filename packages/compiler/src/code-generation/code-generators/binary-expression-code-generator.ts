import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {toLLVMType} from "../util/types";
import {MathObjectReference} from "../value/math-object-reference";
import {Primitive} from "../value/primitive";
import {Value} from "../value/value";

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
        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);
        const resultType = context.typeChecker.getTypeAtLocation(binaryExpression);

        let result: llvm.Value | undefined;
        let resultValue: Value | undefined;

        switch (binaryExpression.operatorToken.kind) {

            // 10.12 & 0
            case ts.SyntaxKind.AmpersandToken:
            case ts.SyntaxKind.AmpersandEqualsToken: {
                const leftInt = Primitive.toInt32(context.generateValue(binaryExpression.left), leftType, resultType, context).generateIR();
                const rightInt = Primitive.toInt32(context.generateValue(binaryExpression.right), rightType, resultType, context).generateIR();

                result = context.builder.createAnd(leftInt, rightInt, "and");
                break;
            }

            // a || b
            case ts.SyntaxKind.AmpersandAmpersandToken: {
                const lhs = context.generateValue(binaryExpression.left).generateIR(context);
                const lhsAsBool = Primitive.toBoolean(lhs, leftType, context);
                const lhsBlock = context.builder.getInsertBlock();
                let rhsBlock = llvm.BasicBlock.create(context.llvmContext, "land.lhs.true");
                const end = llvm.BasicBlock.create(context.llvmContext, "land.end");
                context.builder.createCondBr(lhsAsBool, rhsBlock, end);

                context.scope.enclosingFunction.addBasicBlock(rhsBlock);
                context.builder.setInsertionPoint(rhsBlock);
                const right = context.generateValue(binaryExpression.right).generateIR(context);
                context.builder.createBr(end);
                rhsBlock = context.builder.getInsertBlock();

                context.scope.enclosingFunction.addBasicBlock(end);
                context.builder.setInsertionPoint(end);

                const phi = context.builder.createPhi(toLLVMType(resultType, context), 2, "land");
                phi.addIncoming(lhs, lhsBlock);
                phi.addIncoming(right, rhsBlock);

                result = phi;

                break;
            }

            // a * b
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.AsteriskEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);

                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createMul(leftIr, rightIr, "mul");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFMul(leftIr, rightIr, "mul");
                }

                break;
            }

            // a ** b
            case ts.SyntaxKind.AsteriskAsteriskToken:
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const left = context.generateValue(binaryExpression.left);
                const right = context.generateValue(binaryExpression.right);
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.NumberLike)) {
                    result = MathObjectReference.pow(left, right, resultType, context).generateIR(context);
                }

                break;
            }

            // a | b
            case ts.SyntaxKind.BarToken:
            case ts.SyntaxKind.BarEqualsToken: {
                const intType = resultType;
                const left = context.generateValue(binaryExpression.left);
                const lhsIntValue = Primitive.toInt32(left, leftType, intType, context).generateIR();

                const right = context.generateValue(binaryExpression.right);
                const rhsIntValue = Primitive.toInt32(right, rightType, intType, context).generateIR();

                result = context.builder.createOr(lhsIntValue, rhsIntValue, "or");

                break;
            }

            // a || b
            case ts.SyntaxKind.BarBarToken: {
                const lhs = context.generateValue(binaryExpression.left).generateIR(context);
                const lhsBlock = context.builder.getInsertBlock();
                const lhsAsBool = Primitive.toBoolean(lhs, leftType, context);

                let rhsBlock = llvm.BasicBlock.create(context.llvmContext, "lor.lhs.false");
                const lorEnd = llvm.BasicBlock.create(context.llvmContext, "lor.end");
                context.builder.createCondBr(lhsAsBool, lorEnd, rhsBlock);

                context.scope.enclosingFunction.addBasicBlock(rhsBlock);
                context.builder.setInsertionPoint(rhsBlock);
                const rhs = context.generateValue(binaryExpression.right).generateIR(context);
                context.builder.createBr(lorEnd);
                rhsBlock = context.builder.getInsertBlock();

                context.scope.enclosingFunction.addBasicBlock(lorEnd);
                context.builder.setInsertionPoint(lorEnd);

                const phi = context.builder.createPhi(toLLVMType(resultType, context), 2, "lor");
                phi.addIncoming(lhs, lhsBlock);
                phi.addIncoming(rhs, rhsBlock);

                result = phi;
                break;
            }

            // a ^ b
            case ts.SyntaxKind.CaretEqualsToken:
            case ts.SyntaxKind.CaretToken: {
                const leftInt = Primitive.toInt32(context.generateValue(binaryExpression.left), leftType, resultType, context).generateIR();
                const rightInt = Primitive.toInt32(context.generateValue(binaryExpression.right), rightType, resultType, context).generateIR();

                result = context.builder.createXor(leftInt, rightInt, "xor");

                break;
            }

            // a, b, c
            case ts.SyntaxKind.CommaToken: {
                context.generateValue(binaryExpression.left).generateIR(context);
                result = context.generateValue(binaryExpression.right).generateIR(context);

                break;
            }

            // a === b
            case ts.SyntaxKind.EqualsEqualsEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Object)) {
                    result = context.builder.createICmpEQ(leftIr, rightIr, "cmpEQ");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOEQ(leftIr, rightIr, "cmpEQ");
                }

                break;
            }

            // !==
            case ts.SyntaxKind.ExclamationEqualsEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Object)) {
                    result = context.builder.createICmpNE(leftIr, rightIr, "cmpNE");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpONE(leftIr, rightIr, "cmpNE");
                }

                break;
            }

            // a > b
            case ts.SyntaxKind.GreaterThanToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSGT(context.builder.createZExt(leftIr, llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(rightIr, llvm.Type.getInt32Ty(context.llvmContext)), "cmpGT");
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSGT(leftIr, rightIr, "cmpGT");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGT(leftIr, rightIr, "cmpGT");
                }

                break;
            }

            // a >= b
            case ts.SyntaxKind.GreaterThanEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSGE(context.builder.createZExt(leftIr, llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(rightIr, llvm.Type.getInt32Ty(context.llvmContext)), "cmpGE");
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSGE(leftIr, rightIr, "cmpGE");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGE(leftIr, rightIr, "cmpGE");
                }

                break;
            }

            // a >> b
            case ts.SyntaxKind.GreaterThanGreaterThanToken:
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken: {
                const leftInt = Primitive.toInt32(context.generateValue(binaryExpression.left), leftType, resultType, context).generateIR();
                const rightInt = Primitive.toInt32(context.generateValue(binaryExpression.right), rightType, resultType, context).generateIR();

                // mask not needed, less than 32 guaranteed by wasm
                result = context.builder.createAShr(leftInt, rightInt, "ashr");

                break;
            }

            // a >>> b
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
            case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken: {
                const leftInt = Primitive.toInt32(context.generateValue(binaryExpression.left), leftType, resultType, context).generateIR();
                const rightInt = Primitive.toInt32(context.generateValue(binaryExpression.right), rightType, resultType, context).generateIR();

                // mask not needed, less than 32 guaranteed by wasm
                result = context.builder.createLShr(leftInt, rightInt, "lshr");

                break;
            }

            // a < b
            case ts.SyntaxKind.LessThanToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSLT(context.builder.createZExt(leftIr, llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(rightIr, llvm.Type.getInt32Ty(context.llvmContext)), "cmpLT");
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLT(leftIr, rightIr, "cmpLT");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOLT(leftIr, rightIr, "cmpLT");
                }

                break;
            }

            // a <= b
            case ts.SyntaxKind.LessThanEqualsToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createICmpSLE(context.builder.createZExt(leftIr, llvm.Type.getInt32Ty(context.llvmContext)), context.builder.createZExt(rightIr, llvm.Type.getInt32Ty(context.llvmContext)), "cmpLE");
                } else if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLE(leftIr, rightIr, "cmpLE");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOLE(leftIr, rightIr, "cmpLE");
                }

                break;
            }

            // a << b
            case ts.SyntaxKind.LessThanLessThanToken:
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
                const leftInt = Primitive.toInt32(context.generateValue(binaryExpression.left), leftType, resultType, context).generateIR();
                const rightInt = Primitive.toInt32(context.generateValue(binaryExpression.right), rightType, resultType, context).generateIR();

                // mask not needed, less than 32 guaranteed by wasm
                result = context.builder.createShl(leftInt, rightInt, "shl");

                break;

            // a - b
            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(leftIr, rightIr, "sub");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(leftIr, rightIr, "fsub");
                }

                break;
            }

            // a % b
            case ts.SyntaxKind.PercentToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSRem(leftIr, rightIr, "srem");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFRem(leftIr, rightIr, "frem");
                }

                break;
            }

            // a + b
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(leftIr, rightIr, "add");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(leftIr, rightIr, "fadd");
                }

                break;
            }

            // a / b
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                const leftIr = context.generateValue(binaryExpression.left).generateIR(context);
                const rightIr = context.generateValue(binaryExpression.right).generateIR(context);
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSDiv(leftIr, rightIr, "sdiv");
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFDiv(leftIr, rightIr, "div");
                }

                break;
            }

            // a = b
            case ts.SyntaxKind.FirstAssignment:
                BinaryExpressionCodeGenerator.assertOperandAreOfEqualType(binaryExpression, context);

                resultValue = context.generateValue(binaryExpression.right);
        }

        if (result) {
            resultValue = context.value(result, resultType);
        }

        if (!resultValue) {
            throw CodeGenerationDiagnostic.unsupportedBinaryOperation(binaryExpression, context.typeChecker.typeToString(leftType), context.typeChecker.typeToString(leftType));
        }

        if (isAssignment(binaryExpression.operatorToken)) {
            context.assignValue(context.generateValue(binaryExpression.left), resultValue);
        }

        return resultValue;
    }

    private static assertOperandAreOfEqualType(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext) {
        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);

        if (!context.typeChecker.isAssignableTo(leftType, rightType)) {
            throw CodeGenerationDiagnostic.unsupportedImplicitCastOfBinaryExpressionOperands(binaryExpression, context.typeChecker.typeToString(leftType), context.typeChecker.typeToString(rightType));
        }
    }
}

export default BinaryExpressionCodeGenerator;

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "../util/array-code-generator";


function isAssignmentToArray(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): boolean {
    if (binaryExpression.operatorToken.kind !== ts.SyntaxKind.FirstAssignment && binaryExpression.operatorToken.kind !== ts.SyntaxKind.LastAssignment) {
        return false;
    }

    return ArrayCodeGenerator.isArrayAccess(binaryExpression.left, context);
}

function isAssignmentToArrayLength(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): boolean {
    if (binaryExpression.operatorToken.kind !== ts.SyntaxKind.FirstAssignment && binaryExpression.operatorToken.kind !== ts.SyntaxKind.LastAssignment) {
        return false;
    }

    return binaryExpression.left.kind === ts.SyntaxKind.PropertyAccessExpression &&
        ArrayCodeGenerator.isArrayNode((binaryExpression.left as ts.PropertyAccessExpression).expression, context)
        && (binaryExpression.left as ts.PropertyAccessExpression).name.text === "length";
}

/**
 * Code Generator for binary expressions, e.g. 5+3
 */
class BinaryExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.BinaryExpression> {
    syntaxKind = ts.SyntaxKind.BinaryExpression;

    generateValue(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): llvm.Value {
        if (isAssignmentToArray(binaryExpression, context)) {
            return this.handleArrayAssignment(binaryExpression, context);
        }

        if (isAssignmentToArrayLength(binaryExpression, context)) {
            return this.handleArrayLengthAssignment(binaryExpression, context);
        }

        return this.handleBinaryExpression(binaryExpression, context);
    }

    generate(node: ts.BinaryExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    private handleArrayAssignment(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): llvm.Value {
        const elementAccessExpression = binaryExpression.left as ts.ElementAccessExpression;
        const arrayCodeGeneratorHelper = ArrayCodeGenerator.create(elementAccessExpression.expression, context);

        const array = context.generate(elementAccessExpression.expression);
        const index = context.generate(elementAccessExpression.argumentExpression!); // TODO, what if undefined
        const right = context.generate(binaryExpression.right);
        arrayCodeGeneratorHelper.setElement(array, index, right);

        return right;
    }

    private handleArrayLengthAssignment(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext) {
        const propertyAccess = binaryExpression.left as ts.PropertyAccessExpression;
        const arrayCodeGenerator = ArrayCodeGenerator.create(propertyAccess.expression, context);

        const array = context.generate(propertyAccess.expression);
        const length = context.generate(binaryExpression.right);

        return arrayCodeGenerator.setLength(array, length);
    }

    private handleBinaryExpression(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): llvm.Value {
        const left = context.generate(binaryExpression.left);
        const right = context.generate(binaryExpression.right);

        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        let result: llvm.Value | undefined;
        // const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);
        // assert(rightType.flags === leftType.flags, `Right and left type of binary expression have to be equal (left: ${ts.TypeFlags[leftType.flags]}, right: ${ts.TypeFlags[rightType.flags]})`);

        switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskToken:
                if (leftType.flags & ts.TypeFlags.Int) {
                    result = context.builder.createMul(left, right);
                }

                break;

            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(left, right);
                }

                break;

            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(left, right);
                }

                break;

            case ts.SyntaxKind.GreaterThanToken: {
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSGT(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOGT(left, right);
                }

                break;
            }

            case ts.SyntaxKind.LessThanToken: {
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLT(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULT(left, right);
                }

                break;
            }

            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSDiv(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFDiv(left, right);
                }

                break;
            }

            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpEQ(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpOEQ(left, right);
                }
                break;

            case ts.SyntaxKind.LessThanEqualsToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpSLE(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpULE(left, right);
                }

                break;

            case ts.SyntaxKind.PercentToken:
                if (leftType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSRem(left, right);
                } else if (leftType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFRem(left, right);
                }

                break;

            case ts.SyntaxKind.FirstAssignment:
                // FIXME we need to get the allocation of the left hand side... but that might no be that easy what if it is an array or object element?
                result = context.builder.createStore(right, context.scope.getVariable(context.typeChecker.getSymbolAtLocation(binaryExpression.left)));
        }

        if (!result) {
            throw new Error(`Unsupported binary operator ${ts.SyntaxKind[binaryExpression.operatorToken.kind]}`);
        }

        switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.PlusEqualsToken:
                // FIXME we need to get the allocation of the left hand side... but that might no be that easy what if it is an array or object element?
                context.builder.createStore(result, context.scope.getVariable(context.typeChecker.getSymbolAtLocation(binaryExpression.left)));
        }

        return result;
    }
}

export default BinaryExpressionCodeGenerator;

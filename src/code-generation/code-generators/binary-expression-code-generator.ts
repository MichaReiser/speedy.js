import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class BinaryExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.BinaryExpression> {
    syntaxKind = ts.SyntaxKind.BinaryExpression;

    generateValue(binaryExpression: ts.BinaryExpression, context: CodeGenerationContext): llvm.Value {
        const left = context.generate(binaryExpression.left);
        const right = context.generate(binaryExpression.right);

        const name = binaryExpression.name && binaryExpression.name.text ? binaryExpression.name.text : "" ;
        const leftType = context.typeChecker.getTypeAtLocation(binaryExpression.left);
        // const rightType = context.typeChecker.getTypeAtLocation(binaryExpression.right);

        switch (binaryExpression.operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFAdd(left, right, name);
                }

                break;

            case ts.SyntaxKind.MinusToken:
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFSub(left, right, name);
                }
                break;

            case ts.SyntaxKind.LessThanToken: {
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFCmpULT(left, right, name);
                }
                break;
            }

            case ts.SyntaxKind.SlashToken: {
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFDiv(left, right, name);
                }
                break;
            }

            case ts.SyntaxKind.EqualsEqualsEqualsToken:
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFCmpUEQ(left, right, name);
                }
                break;

            case ts.SyntaxKind.LessThanEqualsToken:
                if (leftType.flags === ts.TypeFlags.Number) {
                    return context.builder.createFCmpULE(left, right, name);
                }

                break;

            case ts.SyntaxKind.PercentToken:
                if (leftType.flags === ts.TypeFlags.Number) {
                    // TODO we need an import for frem, also use srem? This is awfully slow
                    // replace with /emscripten/system/lib/libc/musl/src/math/remainderl.c call (math.h remainder)
                    const lhsInt = context.builder.createFPToSI(left, llvm.Type.getInt64Ty(context.llvmContext));
                    const rhsInt = context.builder.createFPToSI(right, llvm.Type.getInt64Ty(context.llvmContext));
                    const remainder = context.builder.createSRem(lhsInt, rhsInt, name);
                    return context.builder.createSIToFP(remainder, llvm.Type.getDoubleTy(context.llvmContext));
                }

                break;
        }

        throw new Error(`Unsupported binary operator ${ts.SyntaxKind[binaryExpression.operatorToken.kind]}`);
    }

    generate(node: ts.BinaryExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default BinaryExpressionCodeGenerator;

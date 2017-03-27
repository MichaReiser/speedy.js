import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "../value/value";
import {CodeGenerationError} from "../code-generation-exception";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class PrefixUnaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PrefixUnaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.PrefixUnaryExpression;

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(node.operand);
        const leftValue = left.generateIR();
        const type = context.typeChecker.getTypeAtLocation(node.operand);
        let result: llvm.Value | undefined;

        switch (node.operator) {
            case ts.SyntaxKind.ExclamationToken:
                if (type.flags & ts.TypeFlags.BooleanLike) {
                    result = context.builder.createNeg(leftValue);
                } else if (type.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createICmpNE(leftValue, llvm.ConstantInt.get(context.llvmContext, 0));
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFCmpONE(leftValue, llvm.ConstantFP.get(context.llvmContext, 0));
                }

                break;

            case ts.SyntaxKind.MinusToken:
                if (type.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createNeg(leftValue);
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFNeg(leftValue);
                }

                break;

            case ts.SyntaxKind.MinusMinusToken:
                if (type.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(leftValue, llvm.ConstantInt.get(context.llvmContext, 1));
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(leftValue, llvm.ConstantFP.get(context.llvmContext, 1.0));
                }

                break;

            case ts.SyntaxKind.PlusPlusToken:
                if (type.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(leftValue, llvm.ConstantInt.get(context.llvmContext, 1));
                    context.assignValue(left, context.value(result, type));
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(leftValue, llvm.ConstantFP.get(context.llvmContext, 1.0));
                    context.assignValue(left, context.value(result, type));
                }

                break;

            case ts.SyntaxKind.TildeToken:
                let intValue: llvm.Value | undefined;
                if (type.flags & ts.TypeFlags.IntLike) {
                    intValue = leftValue;
                } else if (type.flags & (ts.TypeFlags.BooleanLike)) {
                    intValue = context.builder.createIntCast(leftValue, llvm.Type.getInt32Ty(context.llvmContext), true);
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    intValue = context.builder.createFPToSI(leftValue, llvm.Type.getInt32Ty(context.llvmContext));
                }

                if (intValue) {
                    result = context.builder.createXor(intValue, llvm.Constant.getAllOnesValue(llvm.Type.getInt32Ty(context.llvmContext)));
                }

                break;
        }

        if (!result) {
            throw CodeGenerationError.unsupportedUnaryOperation(node, context.typeChecker.typeToString(type));
        }

        return context.value(result, type);
    }
}

export default PrefixUnaryExpressionCodeGenerator;

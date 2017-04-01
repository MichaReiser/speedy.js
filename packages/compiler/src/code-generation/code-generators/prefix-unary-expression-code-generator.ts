import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "../value/value";
import {CodeGenerationError} from "../code-generation-error";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class PrefixUnaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PrefixUnaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.PrefixUnaryExpression;

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(node.operand);
        const leftValue = left.generateIR();
        const type = context.typeChecker.getTypeAtLocation(node.operand);
        let result: llvm.Value | undefined;

        switch (node.operator) {
            case ts.SyntaxKind.ExclamationToken:
                const booleanValue = Primitive.toBoolean(leftValue, type, context);
                result = context.builder.createNot(booleanValue);

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
                } else if (type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(leftValue, llvm.ConstantFP.get(context.llvmContext, 1.0));
                }

                break;

            case ts.SyntaxKind.TildeToken:
                let intValue = Primitive.toInt32(leftValue, type, context.typeChecker.getTypeAtLocation(node), context);
                result = context.builder.createNot(intValue);

                break;
        }

        if (!result) {
            throw CodeGenerationError.unsupportedUnaryOperation(node, context.typeChecker.typeToString(type));
        }

        const resultValue = context.value(result, type);

        if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
            context.assignValue(left, resultValue);
        }
        return resultValue;
    }
}

export default PrefixUnaryExpressionCodeGenerator;

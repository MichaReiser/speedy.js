import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "../value/value";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class PrefixUnaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PrefixUnaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.PrefixUnaryExpression;

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(node.operand);
        const operandType = context.typeChecker.getTypeAtLocation(node.operand);
        const resultType = context.typeChecker.getTypeAtLocation(node);
        let result: llvm.Value | undefined;

        switch (node.operator) {
            case ts.SyntaxKind.ExclamationToken:
                const booleanValue = Primitive.toBoolean(left, operandType, context);
                result = context.builder.createNot(booleanValue, "not");

                break;

            case ts.SyntaxKind.MinusToken:
                if (operandType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createNeg(left.generateIR(context), "neg");
                } else if (operandType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFNeg(left.generateIR(context), "neg");
                }

                break;

            case ts.SyntaxKind.MinusMinusToken:
                if (operandType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createSub(left.generateIR(context), llvm.ConstantInt.get(context.llvmContext, 1), "sub");
                } else if (operandType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFSub(left.generateIR(context), llvm.ConstantFP.get(context.llvmContext, 1.0), "fsub");
                }

                break;

            case ts.SyntaxKind.PlusToken:
                if (operandType.flags & ts.TypeFlags.IntLike || operandType.flags & ts.TypeFlags.NumberLike || operandType.flags & ts.TypeFlags.BooleanLike) {
                    const castedToResultType = left.castImplicit(resultType, context);
                    result = castedToResultType ? castedToResultType.generateIR(context) : undefined;
                }

                break;

            case ts.SyntaxKind.PlusPlusToken:
                if (operandType.flags & ts.TypeFlags.IntLike) {
                    result = context.builder.createAdd(left.generateIR(context), llvm.ConstantInt.get(context.llvmContext, 1), "add");
                } else if (operandType.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createFAdd(left.generateIR(context), llvm.ConstantFP.get(context.llvmContext, 1.0), "fadd");
                }

                break;

            case ts.SyntaxKind.TildeToken:
                let intValue = Primitive.toInt32(left, operandType, resultType, context).generateIR();
                result = context.builder.createNot(intValue, "not");

                break;
        }

        if (!result) {
            throw CodeGenerationDiagnostic.unsupportedUnaryOperation(node, context.typeChecker.typeToString(operandType));
        }

        const resultValue = context.value(result, resultType);

        if (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken) {
            context.assignValue(left, resultValue);
        }
        return resultValue;
    }
}

export default PrefixUnaryExpressionCodeGenerator;

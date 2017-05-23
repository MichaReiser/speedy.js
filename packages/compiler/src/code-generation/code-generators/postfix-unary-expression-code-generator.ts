import * as llvm from "llvm-node";
import * as ts from "typescript";

import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {Value} from "../value/value";

class PostfixUnaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PostfixUnaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.PostfixUnaryExpression;

    generate(postfixUnaryExpression: ts.PostfixUnaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(postfixUnaryExpression.operand);
        const before = left.generateIR(context);
        let updated: llvm.Value | undefined;
        let operandType = context.typeChecker.getTypeAtLocation(postfixUnaryExpression.operand);

        switch (postfixUnaryExpression.operator) {
            case ts.SyntaxKind.PlusPlusToken:
                if (operandType.flags & ts.TypeFlags.IntLike) {
                    updated = context.builder.createAdd(before, llvm.ConstantInt.get(context.llvmContext, 1), "inc");
                } else if (operandType.flags & ts.TypeFlags.NumberLike) {
                    updated = context.builder.createFAdd(before, llvm.ConstantFP.get(context.llvmContext, 1), "inc");
                }
                break;

            case ts.SyntaxKind.MinusMinusToken:
                if (operandType.flags & ts.TypeFlags.IntLike) {
                    updated = context.builder.createAdd(before, llvm.ConstantInt.get(context.llvmContext, -1), "dec");
                } else if (operandType.flags & ts.TypeFlags.NumberLike) {
                    updated = context.builder.createFAdd(before, llvm.ConstantFP.get(context.llvmContext, -1), "dec");
                }
                break;
        }

        if (!updated) {
            throw CodeGenerationDiagnostic.unsupportedUnaryOperation(postfixUnaryExpression, context.typeChecker.typeToString(operandType));
        }

        context.assignValue(left, context.value(updated, operandType));

        return context.value(before, operandType);
    }
}

export default PostfixUnaryExpressionCodeGenerator;

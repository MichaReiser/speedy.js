import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";

class PrefixUnaryExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PrefixUnaryExpression, Value> {
    syntaxKind = ts.SyntaxKind.PrefixUnaryExpression;

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): Value {
        const left = context.generateValue(node.operand);
        const leftValue = left.generateIR();
        const type = context.typeChecker.getTypeAtLocation(node.operand);
        let result: llvm.Value;

        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken:
                if (type.flags & ts.TypeFlags.Int) {
                    result = context.builder.createAdd(leftValue, llvm.ConstantInt.get(context.llvmContext, 1));
                    this.setValue(left, context.value(result, type));
                    break;
                }

                if (type.flags & ts.TypeFlags.Number) {
                    result = context.builder.createFAdd(leftValue, llvm.ConstantFP.get(context.llvmContext, 1.0));
                    this.setValue(left, context.value(result, type));
                    break;
                }

            case ts.SyntaxKind.MinusToken:
                if (type.flags & ts.TypeFlags.IntLike || type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createNeg(leftValue);
                    break;
                }

            default:
                throw new Error(`Unsupported unary operator ${ts.SyntaxKind[node.operator]}`);
        }

        return context.value(result, type);
    }

    private setValue(target: Value, value: Value) {
        if (target.isAssignable()) {
            target.generateAssignmentIR(value);
        } else {
            throw new Error(`Cannot set value on not assignable target ${target}`);
        }
    }
}

export default PrefixUnaryExpressionCodeGenerator;

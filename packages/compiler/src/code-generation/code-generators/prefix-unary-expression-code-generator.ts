import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class PrefixUnaryExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.PrefixUnaryExpression> {
    syntaxKind = ts.SyntaxKind.PrefixUnaryExpression;

    generateValue(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): llvm.Value {
        const value = context.generate(node.operand);
        const type = context.typeChecker.getTypeAtLocation(node.operand);
        const symbol = context.typeChecker.getSymbolAtLocation(node.operand);
        let result: llvm.Value;

        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken:
                if (type.flags & ts.TypeFlags.Int) {
                    result = context.builder.createAdd(value, llvm.ConstantInt.get(context.llvmContext, 1));
                    context.builder.createStore(result, context.scope.getVariable(symbol));
                    break;
                }

                if (type.flags & ts.TypeFlags.Number) {
                    result = context.builder.createFAdd(value, llvm.ConstantFP.get(context.llvmContext, 1.0));
                    context.builder.createStore(result, context.scope.getVariable(symbol));
                    break;
                }

            case ts.SyntaxKind.MinusToken:
                if (type.flags & ts.TypeFlags.IntLike || type.flags & ts.TypeFlags.NumberLike) {
                    result = context.builder.createNeg(value);
                    break;
                }

            default:
                throw new Error(`Unsupported unary operator ${ts.SyntaxKind[node.operator]}`);
        }

        return result; // FIXME this fails for properties
    }

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default PrefixUnaryExpressionCodeGenerator;

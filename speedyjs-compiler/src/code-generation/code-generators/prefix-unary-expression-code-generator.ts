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
        let updatedValue: llvm.Value;

        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken:
                if (type.flags & ts.TypeFlags.Int) {
                    updatedValue = context.builder.createAdd(value, llvm.ConstantInt.get(context.llvmContext, 1));
                    break;
                }

                if (type.flags & ts.TypeFlags.Number) {
                    updatedValue = context.builder.createFAdd(value, llvm.ConstantFP.get(context.llvmContext, 1.0));
                    break;
                }


            default:
                throw new Error(`Unsupported unary operator ${ts.SyntaxKind[node.operator]}`);
        }

        return context.builder.createStore(updatedValue, context.scope.getVariable(symbol)); // FIXME this fails for properties
    }

    generate(node: ts.PrefixUnaryExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default PrefixUnaryExpressionCodeGenerator;

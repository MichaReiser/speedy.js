import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "../util/array-code-generator";

/**
 * Code Generator for new statements
 */
class NewExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.NewExpression> {
    syntaxKind = ts.SyntaxKind.NewExpression;

    generateValue(newExpression: ts.NewExpression, context: CodeGenerationContext): llvm.Value {
        if (ArrayCodeGenerator.isArrayNode(newExpression.expression, context)) {
            return this.newArrayExpression(newExpression, context);
        }

        throw new Error("Unsupported Call to new");
    }

    generate(node: ts.NewExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    private newArrayExpression(newExpression: ts.NewExpression, context: CodeGenerationContext) {
        const arrayCodeGeneratorHelper = ArrayCodeGenerator.create(newExpression, context);

        if (newExpression.arguments.length === 1) {
            assert (context.typeChecker.getTypeAtLocation(newExpression.arguments[0]).flags & ts.TypeFlags.NumberLike, "size of new Array(size) call needs to be a number");
            const size = context.generate(newExpression.arguments[0]);

            return arrayCodeGeneratorHelper.newArray(size);
        } else {
            return arrayCodeGeneratorHelper.newArray(newExpression.arguments);
        }
    }
}

export default NewExpressionCodeGenerator;

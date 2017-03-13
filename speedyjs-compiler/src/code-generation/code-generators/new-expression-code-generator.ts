import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGeneratorHelper} from "../util/array-code-generator-helper";

/**
 * Code Generator for new statements
 */
class NewExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.NewExpression> {
    syntaxKind = ts.SyntaxKind.NewExpression;

    generateValue(newExpression: ts.NewExpression, context: CodeGenerationContext): llvm.Value {
        if (ArrayCodeGeneratorHelper.isArrayNode(newExpression.expression, context)) {
            return this.newArrayExpression(newExpression, context);
        }

        throw new Error("Unsupported Call to new");
    }

    generate(node: ts.NewExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    private newArrayExpression(newExpression: ts.NewExpression, context: CodeGenerationContext) {
        const arrayCodeGeneratorHelper = new ArrayCodeGeneratorHelper(context);

        const elementType = arrayCodeGeneratorHelper.getElementType(newExpression);

        if (newExpression.arguments.length === 1) {
            assert (context.typeChecker.getTypeAtLocation(newExpression.arguments[0]).flags & ts.TypeFlags.NumberLike, "size of new Array(size) call needs to be a number");
            const size = context.generate(newExpression.arguments[0]);

            return arrayCodeGeneratorHelper.newArray(size, elementType);
        } else {
            return arrayCodeGeneratorHelper.newArray(newExpression.arguments, elementType);
        }
    }
}

export default NewExpressionCodeGenerator;

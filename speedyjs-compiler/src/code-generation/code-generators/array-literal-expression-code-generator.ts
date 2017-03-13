import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGeneratorHelper} from "../util/array-code-generator-helper";

/**
 * Code Generator for [1, 2, ...] array expressions
 */
class ArrayLiteralExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.ArrayLiteralExpression> {
    syntaxKind = ts.SyntaxKind.ArrayLiteralExpression;

    generateValue(arrayLiteral: ts.ArrayLiteralExpression, context: CodeGenerationContext): llvm.Value {
        const arrayCodeGenerator = new ArrayCodeGeneratorHelper(context);

        return arrayCodeGenerator.newArray(arrayLiteral.elements, arrayCodeGenerator.getElementType(arrayLiteral));
    }

    generate(node: ts.ArrayLiteralExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

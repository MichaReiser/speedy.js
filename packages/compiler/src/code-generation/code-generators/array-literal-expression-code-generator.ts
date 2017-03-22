import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "../util/array-code-generator";

/**
 * Code Generator for [1, 2, ...] array expressions
 */
class ArrayLiteralExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.ArrayLiteralExpression> {
    syntaxKind = ts.SyntaxKind.ArrayLiteralExpression;

    generateValue(arrayLiteral: ts.ArrayLiteralExpression, context: CodeGenerationContext): llvm.Value {
        const arrayCodeGenerator = ArrayCodeGenerator.create(arrayLiteral, context);
        return arrayCodeGenerator.newArray(arrayLiteral.elements);
    }

    generate(node: ts.ArrayLiteralExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

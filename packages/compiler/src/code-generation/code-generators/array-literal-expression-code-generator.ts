import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayClassReference} from "../value/array-class-reference";
import {ArrayReference} from "../value/array-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code Generator for [1, 2, ...] array expressions
 */
class ArrayLiteralExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ArrayLiteralExpression, ArrayReference> {
    syntaxKind = ts.SyntaxKind.ArrayLiteralExpression;

    generate(arrayLiteral: ts.ArrayLiteralExpression, context: CodeGenerationContext): ArrayReference {
        const type = context.typeChecker.getTypeAtLocation(arrayLiteral);
        const arrayClass = context.scope.getClass(type.getSymbol()) as ArrayClassReference;

        return arrayClass.fromLiteral(type, arrayLiteral.elements.map(value => context.generateValue(value)));
    }
}

export default ArrayLiteralExpressionCodeGenerator;

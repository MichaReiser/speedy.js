import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayClassReference} from "../value/array-class-reference";
import {ArrayReference} from "../value/array-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {getArrayElementType} from "../util/types";

/**
 * Code Generator for [1, 2, ...] array expressions
 */
class ArrayLiteralExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ArrayLiteralExpression, ArrayReference> {
    syntaxKind = ts.SyntaxKind.ArrayLiteralExpression;

    generate(arrayLiteral: ts.ArrayLiteralExpression, context: CodeGenerationContext): ArrayReference {
        let type = context.typeChecker.getTypeAtLocation(arrayLiteral);
        const elementType = getArrayElementType(type);

        if (elementType.flags & ts.TypeFlags.Never) {
            type = context.typeChecker.getContextualType(arrayLiteral);
        }

        return ArrayClassReference.fromLiteral(type as ts.ObjectType, arrayLiteral.elements.map(value => context.generateValue(value)), context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

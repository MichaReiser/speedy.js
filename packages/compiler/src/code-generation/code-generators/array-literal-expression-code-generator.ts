import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayClassReference} from "../value/array-class-reference";
import {ArrayReference} from "../value/array-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {getArrayElementType} from "../util/types";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

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


        const elementRequiringCast = arrayLiteral.elements.find(element => !context.typeChecker.areEqualTypes(context.typeChecker.getTypeAtLocation(element), elementType));
        if (typeof(elementRequiringCast) !== "undefined") {
            throw CodeGenerationDiagnostic.implicitArrayElementCast(elementRequiringCast, context.typeChecker.typeToString(elementType), context.typeChecker.typeToString(context.typeChecker.getTypeAtLocation(elementRequiringCast)));
        }

        const elements = arrayLiteral.elements.map(value => context.generateValue(value).generateIR(context));
        return ArrayClassReference.fromLiteral(type as ts.ObjectType, elements, context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

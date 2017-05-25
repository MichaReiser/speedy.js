import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {getArrayElementType} from "../util/types";
import {ArrayClassReference} from "../value/array-class-reference";
import {ArrayReference} from "../value/array-reference";

/**
 * Code Generator for [1, 2, ...] array expressions
 */
class ArrayLiteralExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ArrayLiteralExpression, ArrayReference> {
    syntaxKind = ts.SyntaxKind.ArrayLiteralExpression;

    generate(arrayLiteral: ts.ArrayLiteralExpression, context: CodeGenerationContext): ArrayReference {
        const type = context.typeChecker.getTypeAtLocation(arrayLiteral);
        const elementType = getArrayElementType(type);

        const elements = new Array<llvm.Value>(arrayLiteral.elements.length);

        for (let i = 0; i < elements.length; ++i) {
            const element = arrayLiteral.elements[i];
            const casted = context.generateValue(element).castImplicit(elementType, context);
            if (!casted) {
                const arrayElementTypeName = context.typeChecker.typeToString(elementType);
                const elementTypeName = context.typeChecker.typeToString(context.typeChecker.getTypeAtLocation(element));
                throw CodeGenerationDiagnostic.implicitArrayElementCast(element, arrayElementTypeName, elementTypeName);
            }
            elements[i] = casted.generateIR(context);
        }

        return ArrayClassReference.fromLiteral(type as ts.ObjectType, elements, context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

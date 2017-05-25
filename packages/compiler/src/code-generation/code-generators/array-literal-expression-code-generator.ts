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

        const elements = new Array<llvm.Value>(arrayLiteral.elements.length);

        for (let i = 0; i < elements.length; ++i) {
            const element = arrayLiteral.elements[i];
            const casted = context.generateValue(element).castImplicit(elementType, context);
            if (!casted) {
                throw CodeGenerationDiagnostic.implicitArrayElementCast(element, context.typeChecker.typeToString(elementType), context.typeChecker.typeToString(context.typeChecker.getTypeAtLocation(element)));
            }
            elements[i] = casted.generateIR(context);
        }

        return ArrayClassReference.fromLiteral(type as ts.ObjectType, elements, context);
    }
}

export default ArrayLiteralExpressionCodeGenerator;

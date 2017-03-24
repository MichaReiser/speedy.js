import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "../value/object-reference";
import {ObjectPropertyReference} from "../value/object-property-reference";

class PropertyAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PropertyAccessExpression, ObjectPropertyReference> {
    syntaxKind = ts.SyntaxKind.PropertyAccessExpression;

    generate(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference {
        const object = context.generateValue(propertyExpression.expression).dereference() as ObjectReference;

        return object.getProperty(propertyExpression);
    }
}

export default PropertyAccessExpressionCodeGenerator;

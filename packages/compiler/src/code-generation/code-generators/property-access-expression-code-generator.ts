import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "../value/object-reference";
import {ObjectPropertyReference} from "../value/object-property-reference";
import {FunctionReference} from "../value/function-reference";

class PropertyAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PropertyAccessExpression, ObjectPropertyReference | FunctionReference> {
    syntaxKind = ts.SyntaxKind.PropertyAccessExpression;

    generate(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const object = context.generateValue(propertyExpression.expression).dereference(context) as ObjectReference;

        return object.getProperty(propertyExpression, context);
    }
}

export default PropertyAccessExpressionCodeGenerator;

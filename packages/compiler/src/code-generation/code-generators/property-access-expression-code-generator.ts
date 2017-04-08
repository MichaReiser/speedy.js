import * as ts from "typescript";
import {CodeGenerationError} from "../../code-generation-error";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {FunctionReference} from "../value/function-reference";
import {ObjectPropertyReference} from "../value/object-property-reference";

class PropertyAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PropertyAccessExpression, ObjectPropertyReference | FunctionReference> {
    syntaxKind = ts.SyntaxKind.PropertyAccessExpression;

    generate(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const object = context.generateValue(propertyExpression.expression).dereference(context);

        if (object.isObject()) {
            return object.getProperty(propertyExpression, context);
        }

        // e.g. on a class / function
        throw CodeGenerationError.unsupportedProperty(propertyExpression);
    }
}

export default PropertyAccessExpressionCodeGenerator;

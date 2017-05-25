import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {ClassReference} from "../value/class-reference";
import {FunctionReference} from "../value/function-reference";
import {ObjectPropertyReference} from "../value/object-property-reference";

class PropertyAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.PropertyAccessExpression, ObjectPropertyReference | FunctionReference> {
    syntaxKind = ts.SyntaxKind.PropertyAccessExpression;

    generate(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const object = context.generateValue(propertyExpression.expression).dereference(context);

        if (object.isObject()) {
            return object.getProperty(propertyExpression, context);
        }

        if (object instanceof ClassReference) {
            throw CodeGenerationDiagnostic.unsupportedStaticProperties(propertyExpression);
        }

        // e.g. on function
        throw CodeGenerationDiagnostic.unsupportedProperty(propertyExpression);
    }
}

export default PropertyAccessExpressionCodeGenerator;

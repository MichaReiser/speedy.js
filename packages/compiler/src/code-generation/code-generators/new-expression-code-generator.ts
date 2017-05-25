import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {ClassReference} from "../value/class-reference";
import {ObjectReference} from "../value/object-reference";

/**
 * Code Generator for new statements
 */
class NewExpressionCodeGenerator implements SyntaxCodeGenerator<ts.NewExpression, ObjectReference> {
    syntaxKind = ts.SyntaxKind.NewExpression;

    generate(newExpression: ts.NewExpression, context: CodeGenerationContext): ObjectReference {
        const classReference = context.generateValue(newExpression.expression) as ClassReference;
        const constructor = classReference.getConstructor(newExpression, context);

        return constructor.invoke(newExpression, context) as ObjectReference;
    }
}

export default NewExpressionCodeGenerator;

import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "../value/object-reference";
import {ClassReference} from "../value/class-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code Generator for new statements
 */
class NewExpressionCodeGenerator implements SyntaxCodeGenerator<ts.NewExpression, ObjectReference> {
    syntaxKind = ts.SyntaxKind.NewExpression;

    generate(newExpression: ts.NewExpression, context: CodeGenerationContext): ObjectReference {
        const classReference = context.generateValue(newExpression.expression) as ClassReference;
        const signature = context.typeChecker.getResolvedSignature(newExpression);
        const constructor = classReference.getConstructor(signature);

        const args = newExpression.arguments ? newExpression.arguments.map(arg => context.generateValue(arg)) : [];

        return constructor.invoke(args) as ObjectReference;
    }
}

export default NewExpressionCodeGenerator;

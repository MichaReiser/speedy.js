import * as ts from "typescript";
import * as assert from "assert";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReference} from "../value/function-reference";
import {Value} from "../value/value";
import {ObjectReference} from "../value/object-reference";

class CallExpressionCodeGenerator implements SyntaxCodeGenerator<ts.CallExpression, Value | void> {
    syntaxKind = ts.SyntaxKind.CallExpression;

    generate(callExpression: ts.CallExpression, context: CodeGenerationContext): Value | void {
        let callee: FunctionReference;

        if (callExpression.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const object = context.generateValue((callExpression.expression as ts.PropertyAccessExpression).expression).dereference();

            assert(object.isObject(), "Object expected as parent of PropertyAccessExpression");
            callee = (object as ObjectReference).getFunction(callExpression);
        } else {
            callee = context.generateValue(callExpression.expression) as FunctionReference;
        }

        return callee.invoke(callExpression.arguments.map(arg => context.generateValue(arg)));
    }
}

export default CallExpressionCodeGenerator;

import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {FunctionReference} from "../value/function-reference";
import {Value} from "../value/value";

class CallExpressionCodeGenerator implements SyntaxCodeGenerator<ts.CallExpression, Value | void> {
    syntaxKind = ts.SyntaxKind.CallExpression;

    generate(callExpression: ts.CallExpression, context: CodeGenerationContext): Value | void {
        const callee = context.generateValue(callExpression.expression).dereference(context) as FunctionReference;
        return callee.invoke(callExpression, context);
    }
}

export default CallExpressionCodeGenerator;

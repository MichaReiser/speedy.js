import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class CallExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.CallExpression> {
    syntaxKind = ts.SyntaxKind.CallExpression;

    generateValue(callExpression: ts.CallExpression, context: CodeGenerationContext): llvm.Value {
        const expression = context.generate(callExpression.expression);
        assert(expression instanceof llvm.Function, "Callee is not a function");

        const callee = expression as llvm.Function;
        const signature = context.typeChecker.getResolvedSignature(callExpression);
        assert(signature.parameters.length === callee.getArguments().length, "Calling functions with more or less arguments than declared parameters is not yet supported");

        const args = callExpression.arguments.map(arg => context.generate(arg));
        return context.builder.createCall(callee, args);
    }

    generate(node: ts.CallExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default CallExpressionCodeGenerator;

import * as ts from "typescript";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class FirstBinaryOperatorCodeGenerator implements ValueSyntaxCodeGenerator<ts.BinaryOperatorToken> {
    syntaxKind = ts.SyntaxKind.FirstBinaryOperator;

    generateValue(node: ts.BinaryOperatorToken, context: CodeGenerationContext): llvm.Value {
        console.log(node);
    }

    generate(node: ts.BinaryOperatorToken, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

}

export default FirstBinaryOperatorCodeGenerator;

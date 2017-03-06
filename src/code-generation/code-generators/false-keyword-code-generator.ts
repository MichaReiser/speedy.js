import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class FalseKeywordCodeGenerator implements ValueSyntaxCodeGenerator<ts.BooleanLiteral> {
    syntaxKind = ts.SyntaxKind.FalseKeyword;

    generateValue(node: ts.BooleanLiteral, context: CodeGenerationContext): llvm.Value {
        return llvm.ConstantInt.getFalse(context.llvmContext);
    }

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

}

export default FalseKeywordCodeGenerator;

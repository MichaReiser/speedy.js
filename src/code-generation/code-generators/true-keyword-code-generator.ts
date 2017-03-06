import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class TrueKeywordCodeGenerator implements ValueSyntaxCodeGenerator<ts.BooleanLiteral> {
    syntaxKind = ts.SyntaxKind.TrueKeyword;

    generateValue(node: ts.BooleanLiteral, context: CodeGenerationContext): llvm.Value {
        return llvm.ConstantInt.getTrue(context.llvmContext);
    }

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

}

export default TrueKeywordCodeGenerator;

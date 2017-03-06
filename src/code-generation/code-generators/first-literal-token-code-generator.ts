import * as ts from "typescript";
import * as llvm from "llvm-node";

import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class FirstLiteralTokenCodeGenerator implements ValueSyntaxCodeGenerator<ts.LiteralLikeNode> {
    syntaxKind = ts.SyntaxKind.FirstLiteralToken;

    generate(node: ts.LiteralLikeNode, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    generateValue(node: ts.LiteralLikeNode, context: CodeGenerationContext): llvm.Value {
        const type = context.typeChecker.getTypeAtLocation(node);
        switch (type.flags) {
            case ts.TypeFlags.NumberLiteral:
                return llvm.ConstantFP.get(context.llvmContext, +node.text);
        }
        throw new Error("Unsupported first literal token");
    }
}

export default FirstLiteralTokenCodeGenerator;

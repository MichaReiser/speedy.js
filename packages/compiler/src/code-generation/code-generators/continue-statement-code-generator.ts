import * as ts from "typescript";
import * as assert from "assert";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Code generator for the continue statement
 */
class ContinueStatementCodeGenerator implements SyntaxCodeGenerator<ts.ContinueStatement, void> {
    syntaxKind = ts.SyntaxKind.ContinueStatement;

    generate(node: ts.ContinueStatement, context: CodeGenerationContext): void {
        let target: llvm.BasicBlock | undefined;

        if (node.label) {
            target = context.scope.getContinueBlock(node.label.text);
        } else {
            target = context.scope.getContinueBlock();
        }

        assert(target, `Continue block for label '${node.label ? node.label.text : ""}' is missing`);

        context.builder.createBr(target!);
    }

}

export default ContinueStatementCodeGenerator;

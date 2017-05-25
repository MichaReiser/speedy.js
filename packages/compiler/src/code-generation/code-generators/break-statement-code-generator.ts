import * as assert from "assert";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code generator for the break statement
 */
class BreakStatementCodeGenerator implements SyntaxCodeGenerator<ts.BreakStatement, void> {
    syntaxKind = ts.SyntaxKind.BreakStatement;

    generate(breakStatement: ts.BreakStatement, context: CodeGenerationContext): void {
        let target: llvm.BasicBlock | undefined;

        if (breakStatement.label) {
            target = context.scope.getBreakBlock(breakStatement.label.text);
        } else {
            target = context.scope.getBreakBlock();
        }

        assert(target, `Break block for label '${breakStatement.label ? breakStatement.label.text : ""}' is missing`);

        context.builder.createBr(target!);
    }

}

export default BreakStatementCodeGenerator;

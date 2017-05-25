import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code generator for labeled statements, e.g.
 * for (let i=0; i < 4; ++i) {
 *       checkj: for (let j = 8; j > 4; --j) {
 *           j -= 1;
 *
 *           if ((j % 2) === 0) {
 *               continue checkj;
 *           }
 *       }
 *   }
 */
class LabeledStatementCodeGenerator implements SyntaxCodeGenerator<ts.LabeledStatement, void> {
    syntaxKind = ts.SyntaxKind.LabeledStatement;

    generate(node: ts.LabeledStatement, context: CodeGenerationContext): void {
        const end = llvm.BasicBlock.create(context.llvmContext, `${node.label.text}.end`);

        context.scope.setBreakBlock(end, node.label.text);
        context.generate(node.statement);

        // The block might not be used, or a for loop overrides the label target with the for.end
        if (!end.useEmpty()) {
            if (!context.builder.getInsertBlock().getTerminator()) {
                context.builder.createBr(end);
            }

            context.scope.enclosingFunction.addBasicBlock(end);
            context.builder.setInsertionPoint(end);
        } else {
            end.release();
        }
    }
}

export default LabeledStatementCodeGenerator;

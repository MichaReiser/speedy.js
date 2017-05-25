import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {generateCondition} from "../util/conditions";

class WhileStatementCodeGenerator implements SyntaxCodeGenerator<ts.WhileStatement, void> {
    syntaxKind = ts.SyntaxKind.WhileStatement;

    generate(whileStatement: ts.WhileStatement, context: CodeGenerationContext): void {
        const condition = llvm.BasicBlock.create(context.llvmContext, "while.cond", context.scope.enclosingFunction);
        let body = llvm.BasicBlock.create(context.llvmContext, "while.body");
        const end = llvm.BasicBlock.create(context.llvmContext, "while.end");

        context.scope.setContinueBlock(condition);
        context.scope.setBreakBlock(end);

        this.setContinueAndBreakLabels(whileStatement.parent, context, condition, end);

        context.builder.createBr(condition);
        context.builder.setInsertionPoint(condition);
        generateCondition(whileStatement.expression, body, end, context);

        context.scope.enclosingFunction.addBasicBlock(body);
        context.builder.setInsertionPoint(body);
        context.generate(whileStatement.statement);
        body = context.builder.getInsertBlock();

        if (!body.getTerminator()) {
            context.builder.createBr(condition);
        }

        context.scope.enclosingFunction.addBasicBlock(end);
        context.builder.setInsertionPoint(end);
    }

    private setContinueAndBreakLabels(parent: ts.Node | undefined, context: CodeGenerationContext, condition: llvm.BasicBlock, end: llvm.BasicBlock) {
        context.scope.setContinueBlock(condition);
        context.scope.setBreakBlock(end);

        if (parent && parent.kind === ts.SyntaxKind.LabeledStatement) {
            const labeledStatement = parent as ts.LabeledStatement;

            if (labeledStatement.label) {
                context.scope.setContinueBlock(condition, labeledStatement.label.text);
                context.scope.setBreakBlock(end, labeledStatement.label.text);
            }
        }
    }
}

export default WhileStatementCodeGenerator;

import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {generateCondition} from "../util/conditions";

class ForStatementCodeGenerator implements SyntaxCodeGenerator<ts.ForStatement, void> {
    syntaxKind = ts.SyntaxKind.ForStatement;

    generate(forStatement: ts.ForStatement, context: CodeGenerationContext): void {
        if (forStatement.initializer) {
            context.generate(forStatement.initializer);
        }

        let head: llvm.BasicBlock;
        const fun = context.scope.enclosingFunction;
        const end = llvm.BasicBlock.create(context.llvmContext, "for.end");
        let body = llvm.BasicBlock.create(context.llvmContext, "for.body");

        if (forStatement.condition) {
            const forBlock = llvm.BasicBlock.create(context.llvmContext, "for.cond", fun);
            context.builder.createBr(forBlock);
            context.builder.setInsertionPoint(forBlock);

            generateCondition(forStatement.condition, body, end, context);
            head = forBlock;
        } else {
            context.builder.createBr(body);
            head = body;
        }

        fun.addBasicBlock(body);
        context.builder.setInsertionPoint(body);

        context.generate(forStatement.statement);
        body = context.builder.getInsertBlock();
        const incrementor = llvm.BasicBlock.create(context.llvmContext, "for.inc");

        if (!body.getTerminator()) {
            context.builder.createBr(incrementor);
        }

        fun.addBasicBlock(incrementor);
        context.builder.setInsertionPoint(incrementor);
        if (forStatement.incrementor) {
            context.generate(forStatement.incrementor);
        }

        context.builder.createBr(head);

        fun.addBasicBlock(end);
        context.builder.setInsertionPoint(end);
    }
}

export default ForStatementCodeGenerator;

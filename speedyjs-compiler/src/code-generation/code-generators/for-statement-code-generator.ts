import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class ForStatementCodeGenerator implements SyntaxCodeGenerator<ts.ForStatement> {
    syntaxKind = ts.SyntaxKind.ForStatement;

    generate(forStatement: ts.ForStatement, context: CodeGenerationContext): void {
        if (forStatement.initializer) {
            context.generateVoid(forStatement.initializer);
        }

        let forEntry: llvm.BasicBlock;
        const fun = context.builder.getInsertBlock().parent!; // TODO ensure that inside function
        const successor = llvm.BasicBlock.create(context.llvmContext, "for-successor");
        let body = llvm.BasicBlock.create(context.llvmContext, "for-body");

        if (forStatement.condition) {
            const forBlock = llvm.BasicBlock.create(context.llvmContext, "for-header", fun);
            context.builder.createBr(forBlock);
            context.builder.setInsertionPoint(forBlock);

            const condition = context.generate(forStatement.condition);

            context.builder.createCondBr(condition, body, successor);

            forEntry = forBlock;
        } else {
            context.builder.createBr(body);
            forEntry = body;
        }

        fun.addBasicBlock(body);
        context.builder.setInsertionPoint(body);

        context.generateVoid(forStatement.statement);
        body = context.builder.getInsertBlock();

        if (!body.getTerminator()) {
            if (forStatement.incrementor) {
                context.generateVoid(forStatement.incrementor);
            }

            context.builder.createBr(forEntry);
        }

        fun.addBasicBlock(successor);
        context.builder.setInsertionPoint(successor);
    }
}

export default ForStatementCodeGenerator;

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class IfStatementCodeGenerator implements SyntaxCodeGenerator<ts.IfStatement> {
    syntaxKind = ts.SyntaxKind.IfStatement;

    generate(ifStatement: ts.IfStatement, context: CodeGenerationContext): void {
        const condition = context.generate(ifStatement.expression);
        const fun = context.builder.getInsertBlock().parent!; // todo.. guarantee that function exists

        let thenBlock = llvm.BasicBlock.create(context.llvmContext, "then", fun);
        let elseBlock = llvm.BasicBlock.create(context.llvmContext, "else");
        const successor = llvm.BasicBlock.create(context.llvmContext, "if-successor");

        context.builder.createCondBr(condition, thenBlock, elseBlock);

        context.builder.setInsertionPoint(thenBlock);
        context.generateVoid(ifStatement.thenStatement);
        thenBlock = context.builder.getInsertBlock();

        if (!thenBlock.getTerminator()) {
            context.builder.createBr(successor);
        }

        fun.addBasicBlock(elseBlock);
        context.builder.setInsertionPoint(elseBlock);

        if (ifStatement.elseStatement) {
            context.generateVoid(ifStatement.elseStatement);
            elseBlock = context.builder.getInsertBlock();
        }

        if (elseBlock.empty) {
            elseBlock.replaceAllUsesWith(successor);
            elseBlock.eraseFromParent();
        } else if (!elseBlock.getTerminator()) {
            context.builder.createBr(successor);
        }

        fun.addBasicBlock(successor);
        context.builder.setInsertionPoint(successor);
    }
}

export default IfStatementCodeGenerator;

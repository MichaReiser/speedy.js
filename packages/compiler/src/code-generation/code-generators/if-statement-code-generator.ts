import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {generateCondition} from "../util/conditions";

class IfStatementCodeGenerator implements SyntaxCodeGenerator<ts.IfStatement, void> {
    syntaxKind = ts.SyntaxKind.IfStatement;

    generate(ifStatement: ts.IfStatement, context: CodeGenerationContext): void {
        const fun = context.scope.enclosingFunction;
        let thenBlock = llvm.BasicBlock.create(context.llvmContext, "if.then");
        let elseBlock = llvm.BasicBlock.create(context.llvmContext, "if.else");
        const end = llvm.BasicBlock.create(context.llvmContext, "if.end");

        generateCondition(ifStatement.expression, thenBlock, elseBlock, context);

        fun.addBasicBlock(thenBlock);
        context.builder.setInsertionPoint(thenBlock);
        context.generate(ifStatement.thenStatement);
        thenBlock = context.builder.getInsertBlock();

        if (!thenBlock.getTerminator()) {
            context.builder.createBr(end);
        }

        fun.addBasicBlock(elseBlock);
        context.builder.setInsertionPoint(elseBlock);

        if (ifStatement.elseStatement) {
            context.generate(ifStatement.elseStatement);
            elseBlock = context.builder.getInsertBlock();
        }

        if (elseBlock.empty) {
            elseBlock.replaceAllUsesWith(end);
            elseBlock.eraseFromParent();
        } else if (!elseBlock.getTerminator()) {
            context.builder.createBr(end);
        }

        fun.addBasicBlock(end);
        context.builder.setInsertionPoint(end);
    }
}

export default IfStatementCodeGenerator;

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";

class IfStatementCodeGenerator implements SyntaxCodeGenerator<ts.IfStatement, void> {
    syntaxKind = ts.SyntaxKind.IfStatement;

    generate(ifStatement: ts.IfStatement, context: CodeGenerationContext): void {
        const conditionValue = context.generateValue(ifStatement.expression).generateIR(context);
        const condition = Primitive.toBoolean(conditionValue, context.typeChecker.getTypeAtLocation(ifStatement.expression), context);
        const fun = context.scope.enclosingFunction;

        let thenBlock = llvm.BasicBlock.create(context.llvmContext, "then", fun);
        let elseBlock = llvm.BasicBlock.create(context.llvmContext, "else");
        const successor = llvm.BasicBlock.create(context.llvmContext, "if-successor");

        context.builder.createCondBr(condition, thenBlock, elseBlock);

        context.builder.setInsertionPoint(thenBlock);
        context.generate(ifStatement.thenStatement);
        thenBlock = context.builder.getInsertBlock();

        if (!thenBlock.getTerminator()) {
            context.builder.createBr(successor);
        }

        fun.addBasicBlock(elseBlock);
        context.builder.setInsertionPoint(elseBlock);

        if (ifStatement.elseStatement) {
            context.generate(ifStatement.elseStatement);
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

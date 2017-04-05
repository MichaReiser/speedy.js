import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class WhileStatementCodeGenerator implements SyntaxCodeGenerator<ts.WhileStatement, void> {
    syntaxKind = ts.SyntaxKind.WhileStatement;

    generate(whileStatement: ts.WhileStatement, context: CodeGenerationContext): void {
        let head = llvm.BasicBlock.create(context.llvmContext, "whileCondition", context.scope.enclosingFunction);
        let body = llvm.BasicBlock.create(context.llvmContext, "whileBody");
        let successor = llvm.BasicBlock.create(context.llvmContext, "whileSuccessor");

        context.builder.createBr(head);
        context.builder.setInsertionPoint(head);
        const conditionValue = context.generateValue(whileStatement.expression);
        const condition = Primitive.toBoolean(conditionValue, context.typeChecker.getTypeAtLocation(whileStatement.expression), context);
        context.builder.createCondBr(condition, body, successor);
        head = context.builder.getInsertBlock();

        context.scope.enclosingFunction.addBasicBlock(body);
        context.builder.setInsertionPoint(body);
        context.generate(whileStatement.statement);
        body = context.builder.getInsertBlock();

        if (!body.getTerminator()) {
            context.builder.createBr(head);
        }

        context.scope.enclosingFunction.addBasicBlock(successor);
        context.builder.setInsertionPoint(successor);
    }
}

export default WhileStatementCodeGenerator;

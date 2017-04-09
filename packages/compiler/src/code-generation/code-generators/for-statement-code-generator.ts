import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";

class ForStatementCodeGenerator implements SyntaxCodeGenerator<ts.ForStatement, void> {
    syntaxKind = ts.SyntaxKind.ForStatement;

    generate(forStatement: ts.ForStatement, context: CodeGenerationContext): void {
        if (forStatement.initializer) {
            context.generate(forStatement.initializer);
        }

        let forEntry: llvm.BasicBlock;
        const fun = context.scope.enclosingFunction;
        const successor = llvm.BasicBlock.create(context.llvmContext, "for-successor");
        let body = llvm.BasicBlock.create(context.llvmContext, "for-body");

        if (forStatement.condition) {
            const forBlock = llvm.BasicBlock.create(context.llvmContext, "for-header", fun);
            context.builder.createBr(forBlock);
            context.builder.setInsertionPoint(forBlock);

            const condition = context.generateValue(forStatement.condition).generateIR(context);
            context.builder.createCondBr(Primitive.toBoolean(condition, context.typeChecker.getTypeAtLocation(forStatement.condition), context), body, successor);

            forEntry = forBlock;
        } else {
            context.builder.createBr(body);
            forEntry = body;
        }

        fun.addBasicBlock(body);
        context.builder.setInsertionPoint(body);

        context.generate(forStatement.statement);
        body = context.builder.getInsertBlock();

        if (!body.getTerminator()) {
            if (forStatement.incrementor) {
                context.generate(forStatement.incrementor);
            }

            context.builder.createBr(forEntry);
        }

        fun.addBasicBlock(successor);
        context.builder.setInsertionPoint(successor);
    }
}

export default ForStatementCodeGenerator;

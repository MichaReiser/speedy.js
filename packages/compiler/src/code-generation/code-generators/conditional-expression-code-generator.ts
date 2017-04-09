import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";
import {Primitive} from "../value/primitive";
import {Address} from "../value/address";

/**
 * Code Generator for condition expressions (condition ? whenTrue : whenFalse);
 */
class ConditionalExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ConditionalExpression, Value> {
    syntaxKind = ts.SyntaxKind.ConditionalExpression;

    generate(node: ts.ConditionalExpression, context: CodeGenerationContext): Value {
        const fn = context.scope.enclosingFunction;

        const whenTrue = llvm.BasicBlock.create(context.llvmContext, "whenTrue");
        const whenFalse = llvm.BasicBlock.create(context.llvmContext, "whenFalse");
        const successor = llvm.BasicBlock.create(context.llvmContext, "successor");

        const condition = context.generateValue(node.condition);

        const result = Address.createAllocationInEntryBlock(context.typeChecker.getTypeAtLocation(node), context, "conditionResult");
        context.builder.createCondBr(Primitive.toBoolean(condition.generateIR(context), context.typeChecker.getTypeAtLocation(node.condition), context), whenTrue, whenFalse);

        fn.addBasicBlock(whenTrue);
        context.builder.setInsertionPoint(whenTrue);
        result.generateAssignmentIR(context.generateValue(node.whenTrue), context);
        context.builder.createBr(successor);

        fn.addBasicBlock(whenFalse);
        context.builder.setInsertionPoint(whenFalse);
        result.generateAssignmentIR(context.generateValue(node.whenFalse), context);
        context.builder.createBr(successor);

        fn.addBasicBlock(successor);
        context.builder.setInsertionPoint(successor);

        return result;
    }
}

export default ConditionalExpressionCodeGenerator;

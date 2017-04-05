import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";
import {ResolvedFunction} from "../value/resolved-function";

export class FunctionDefinitionBuilder {
    private constructor(private fn: llvm.Function, private resolvedFunction: ResolvedFunction, private context: CodeGenerationContext) {
    }

    static create(fn: llvm.Function, resolvedFunction: ResolvedFunction, context: CodeGenerationContext) {
        return new FunctionDefinitionBuilder(fn, resolvedFunction, context);
    }

    /**
     * Builds / Generates the llvm.Function for the given function declaration
     * @param declaration the function declaration
     */
    define(declaration: ts.FunctionLikeDeclaration): void {
        this.context.enterChildScope(this.fn);

        const entryBlock = llvm.BasicBlock.create(this.context.llvmContext, "entry", this.fn);
        const returnBlock = llvm.BasicBlock.create(this.context.llvmContext, "returnBlock");
        this.context.builder.setInsertionPoint(entryBlock);
        this.context.scope.returnBlock = returnBlock;

        if (!(this.resolvedFunction.returnType.flags & ts.TypeFlags.Void)) {
            this.context.scope.returnAllocation = Allocation.create(this.resolvedFunction.returnType, this.context, "return");
        }

        this.allocateArguments();
        this.context.generate(declaration.body!);

        this.setBuilderToReturnBlock(returnBlock);

        // Add Return Statement
        this.generateReturnStatement();

        this.context.leaveChildScope();

        llvm.verifyFunction(this.fn);
    }

    private generateReturnStatement() {
        if (this.context.scope.returnAllocation) {
            this.context.builder.createRet(this.context.scope.returnAllocation.generateIR(this.context));
        } else {
            this.context.builder.createRetVoid();
        }
    }

    private setBuilderToReturnBlock(returnBlock: llvm.BasicBlock) {
        // Current Block is empty, so we can use the current block instead of the return block
        const predecessor = this.context.builder.getInsertBlock();
        if (predecessor.empty) {
            returnBlock.replaceAllUsesWith(predecessor);
            returnBlock.release();
        } else if (returnBlock.useEmpty()) { // No return statement
            returnBlock.release();
        } else { // at least one return statement
            if (!predecessor.getTerminator()) {
                this.context.builder.createBr(returnBlock); // Fall through to return block
            }
            this.fn.addBasicBlock(returnBlock);
            this.context.builder.setInsertionPoint(returnBlock);
        }
    }

    private allocateArguments() {
        const args = this.fn.getArguments();
        for (let i = 0; i < this.resolvedFunction.parameters.length; ++i) {
            const parameter = this.resolvedFunction.parameters[i];
            const allocation = Allocation.create(parameter.type, this.context, parameter.name);

            // TODO wrap varargs
            allocation.generateAssignmentIR(args[i], this.context);

            if (parameter.symbol) {
                this.context.scope.addVariable(parameter.symbol, allocation);
            }

            args[i].name = parameter.name;
        }
    }
}

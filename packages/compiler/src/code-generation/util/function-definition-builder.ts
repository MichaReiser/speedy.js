import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "../value/address";
import {ResolvedFunction} from "../value/resolved-function";
import {Value} from "../value/value";

export class FunctionDefinitionBuilder {
    private _returnValue: Value | undefined = undefined;

    private constructor(private fn: llvm.Function, private resolvedFunction: ResolvedFunction, private context: CodeGenerationContext) {
    }

    static create(fn: llvm.Function, resolvedFunction: ResolvedFunction, context: CodeGenerationContext) {
        return new FunctionDefinitionBuilder(fn, resolvedFunction, context);
    }

    /**
     * Sets the value to return at the end of the function
     * @return {FunctionDefinitionBuilder} this for a fluent api
     */
    returnValue(returnValue: Value) {
        this._returnValue = returnValue;
        return this;
    }

    /**
     * Builds / Generates the llvm.Function for the given function declaration
     * @param declaration the function declaration
     */
    define(declaration: ts.FunctionLikeDeclaration): void {
        this.context.enterChildScope(this.fn);

        let entryBlock = this.fn.getEntryBlock() || llvm.BasicBlock.create(this.context.llvmContext, "entry", this.fn);
        const returnBlock = llvm.BasicBlock.create(this.context.llvmContext, "returnBlock");
        this.context.builder.setInsertionPoint(entryBlock);
        this.context.scope.returnBlock = returnBlock;

        if (!(this.resolvedFunction.returnType.flags & ts.TypeFlags.Void) && !this._returnValue) {
            this.context.scope.returnAllocation = Address.create(this.resolvedFunction.returnType, this.context, "return");
        }

        this.allocateArguments();
        this.context.generate(declaration.body!);

        this.setBuilderToReturnBlock(returnBlock);
        this.generateReturnStatement();

        this.context.leaveChildScope();

        llvm.verifyFunction(this.fn);
    }

    private generateReturnStatement() {
        if (this.context.scope.returnAllocation) {
            this.context.builder.createRet(this.context.scope.returnAllocation.generateIR(this.context));
        } else if (this._returnValue) {
            this.context.builder.createRet(this._returnValue.generateIR(this.context));
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
            const allocation = Address.create(parameter.type, this.context, parameter.name);

            // TODO wrap varargs
            allocation.generateAssignmentIR(args[i], this.context);

            if (parameter.symbol) {
                this.context.scope.addVariable(parameter.symbol, allocation);
            }

            args[i].name = parameter.name;
        }
    }
}

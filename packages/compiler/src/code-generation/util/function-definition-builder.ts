import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";
import {ResolvedFunction} from "../value/resolved-function";
import {Value} from "../value/value";
import {ObjectReference} from "../value/object-reference";
import {ArrayClassReference} from "../value/array-class-reference";

export class FunctionDefinitionBuilder {
    private _returnValue: Value | undefined = undefined;
    private _this: ObjectReference | undefined;

    private constructor(private fn: llvm.Function, private resolvedFunction: ResolvedFunction, private context: CodeGenerationContext) {
    }

    static create(fn: llvm.Function, resolvedFunction: ResolvedFunction, context: CodeGenerationContext) {
        assert(resolvedFunction.declaration, "Resolved function misses declaration and, therefore, cannot be defined.");
        assert(resolvedFunction.definition, "Resolved function misses definition and, therefore, cannot be defined.");
        return new FunctionDefinitionBuilder(fn, resolvedFunction, context);
    }

    get definition() {
        return this.resolvedFunction.definition!;
    }

    get declaration() {
        return this.resolvedFunction.declaration!;
    }

    /**
     * Sets the value to return at the end of the function
     * @return {FunctionDefinitionBuilder} this for a fluent api
     */
    returnValue(returnValue?: Value) {
        this._returnValue = returnValue;
        return this;
    }

    /**
     * Sets the address of the this object in case it is not passed as argument
     * @param thisObject the address of the this object
     * @return {FunctionDefinitionBuilder}
     */
    self(thisObject?: ObjectReference) {
        this._this = thisObject;
        return this;
    }

    /**
     * Builds / Generates the llvm.Function for the function definition of the resolved function
     */
    define(): void {
        this.context.enterChildScope(this.fn);

        let entryBlock = this.fn.getEntryBlock() || llvm.BasicBlock.create(this.context.llvmContext, "entry", this.fn);
        const returnBlock = llvm.BasicBlock.create(this.context.llvmContext, "returnBlock");
        this.context.builder.setInsertionPoint(entryBlock);
        this.context.scope.returnBlock = returnBlock;

        if (!(this.resolvedFunction.returnType.flags & ts.TypeFlags.Void) && !this._returnValue) {
            this.context.scope.returnAllocation = Allocation.create(this.resolvedFunction.returnType, this.context, "return");
        }

        this.allocateArguments();
        this.context.generate(this.definition.body);

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
        const args = this.fn.getArguments().slice();

        // The this object is passed as first argument
        if (this.resolvedFunction.classType && this.resolvedFunction.instanceMethod) {
            assert(args.length - 1 === this.resolvedFunction.parameters.length, "The function declaration has no additional argument for the this object");

            const thisAllocation = Allocation.create(this.resolvedFunction.classType!, this.context, "this");
            const thisArg = args.shift()!;
            thisAllocation.generateAssignmentIR(thisArg, this.context);
            thisArg.name = "this";
            this.context.scope.addVariable(this.resolvedFunction.classType.getSymbol(), thisAllocation);
        }

        for (let i = 0; i < this.resolvedFunction.parameters.length; ++i) {
            const parameter = this.resolvedFunction.parameters[i];
            const parameterDefinition = this.definition.parameters[i];
            const declaredParameterSymbol = this.context.typeChecker.getSymbolAtLocation(parameterDefinition.name);
            const allocation = Allocation.create(parameter.type, this.context, `${parameter.name}.addr`);

            args[i].name = parameter.name;

            if (parameter.variadic) {
                allocation.generateAssignmentIR(ArrayClassReference.fromCArray(parameter.type as ts.ObjectType, args[i], args[++i], this.context), this.context);
            } else {
                allocation.generateAssignmentIR(args[i], this.context);
            }

            this.context.scope.addVariable(declaredParameterSymbol, allocation);

            // a field in a constructor that is marked with private, protected or public. Set the argument value on the field.
            if (this._this && declaredParameterSymbol.flags & ts.SymbolFlags.Property) {
                const fieldOffset = llvm.ConstantInt.get(this.context.llvmContext, this._this.clazz.getFieldOffset(declaredParameterSymbol));
                const fieldAddress = this.context.builder.createInBoundsGEP(this._this.generateIR(this.context), [ llvm.ConstantInt.get(this.context.llvmContext, 0), fieldOffset ], `&${declaredParameterSymbol.name}`);
                this.context.builder.createAlignedStore(args[i], fieldAddress, Allocation.getPreferredValueAlignment(parameter.type, this.context));
            }
        }
    }
}

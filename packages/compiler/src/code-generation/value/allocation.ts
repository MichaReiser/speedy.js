import * as llvm from "llvm-node";
import * as ts from "typescript";
import * as assert from "assert";

import {AssignableValue, Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {Scope} from "../scope";
import {ObjectReference} from "./object-reference";
import {toLLVMType} from "../util/type-mapping";

/**
 * Wrapper for an allocation
 *
 * Is capable to work with Values and ensures correct alignment
 */
export class Allocation implements AssignableValue {

    static create(type: ts.Type, context: CodeGenerationContext, name?: string) {
        const allocationInst = context.builder.createAlloca(toLLVMType(type, context), undefined, name);
        return new Allocation(allocationInst, type, context, name);
    }

    static createInEntryBlock(type: ts.Type, context: CodeGenerationContext, name?: string): Allocation {
        const allocaInst = Allocation.createAllocaInstInEntryBlock(toLLVMType(type, context), context.scope, name);
        return new Allocation(allocaInst, type, context, name);
    }

    static createAllocaInstInEntryBlock(type: llvm.Type, scope: Scope, name?: string) {
        const fn = scope.enclosingFunction.generateIR();
        const entryBlockBuilder = new llvm.IRBuilder(fn.getEntryBlock());

        return entryBlockBuilder.createAlloca(type, undefined, name);
    }

    static load(address: llvm.Value, type: ts.Type, context: CodeGenerationContext, name?: string) {
        const alignment = Allocation.getPreferredAlignment(type, context);
        return context.builder.createAlignedLoad(address, alignment, name);
    }

    private static getPreferredAlignment(type: ts.Type, context: CodeGenerationContext) {
        return context.module.dataLayout.getPrefTypeAlignment(toLLVMType(type, context));
    }

    constructor(public allocaInst: llvm.AllocaInst | llvm.GlobalVariable, public type: ts.Type, private context: CodeGenerationContext, public name?: string) {
    }

    private get alignment() {
        return Allocation.getPreferredAlignment(this.type, this.context);
    }

    isAssignable(): boolean {
        return !(this.allocaInst instanceof llvm.GlobalVariable && this.allocaInst.constant);
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(): Value {
        return this.context.value(this.generateIR(), this.type);
    }

    generateIR(): llvm.Value {
        return Allocation.load(this.allocaInst, this.type, this.context, this.name);
    }

    generateAssignmentIR(value: Value | llvm.Value) {
        assert(this.isAssignable, "Cannot assign to constant global variable");

        let llvmValue = value instanceof llvm.Value ? value : value.generateIR();
        this.context.builder.createAlignedStore(llvmValue, this.allocaInst, this.alignment, false);
    }
}

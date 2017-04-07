import * as llvm from "llvm-node";
import * as ts from "typescript";
import * as assert from "assert";

import {AssignableValue, Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {Scope} from "../scope";
import {ObjectReference} from "./object-reference";
import {toLLVMType} from "../util/types";

/**
 * Wrapper for an address
 *
 * Is capable to work with Values and ensures correct alignment
 */
export class Address implements AssignableValue {

    static create(type: ts.Type, context: CodeGenerationContext, name?: string) {
        const allocationInst = context.builder.createAlloca(toLLVMType(type, context), undefined, name);
        const alignment = Address.getPreferredAlignment(type, context);
        return new Address(allocationInst, type, alignment, name);
    }

    static createAllocationInEntryBlock(type: ts.Type, context: CodeGenerationContext, name?: string): Address {
        const allocaInst = Address.createAllocaInstInEntryBlock(toLLVMType(type, context), context.scope, name);
        const alignment = Address.getPreferredAlignment(type, context);
        return new Address(allocaInst, type, alignment, name);
    }

    static createAllocaInstInEntryBlock(type: llvm.Type, scope: Scope, name?: string) {
        const fn = scope.enclosingFunction;
        const entryBlock = fn.getEntryBlock();
        assert(entryBlock, "The function requires an entry block");

        const entryBlockBuilder = new llvm.IRBuilder(fn.getEntryBlock()!);
        return entryBlockBuilder.createAlloca(type, undefined, name);
    }

    static forGlobalVariable(globalVariable: llvm.GlobalVariable, type: ts.Type, context: CodeGenerationContext, name?: string) {
        const alignment = Address.getPreferredAlignment(type, context);
        return new Address(globalVariable, type, alignment, name);
    }

    static forPointer(value: llvm.Value, type: ts.Type, context: CodeGenerationContext, name?: string) {
        assert(value.type.isPointerTy(), "Needs to be a pointer type");
        const alignment = Address.getPreferredAlignment(type, context);

        return new Address(value, type, alignment, name);
    }

    static load(address: llvm.Value, type: ts.Type, context: CodeGenerationContext, name?: string) {
        const alignment = Address.getPreferredAlignment(type, context);
        return context.builder.createAlignedLoad(address, alignment, name);
    }

    static getPreferredAlignment(type: ts.Type, context: CodeGenerationContext) {
        return context.module.dataLayout.getPrefTypeAlignment(toLLVMType(type, context));
    }

    private constructor(public store: llvm.Value, public type: ts.Type, private alignment: number, public name?: string) {
    }

    isAssignable(): boolean {
        return !(this.store instanceof llvm.GlobalVariable && this.store.constant);
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(context: CodeGenerationContext): Value {
        return context.value(this.generateIR(context), this.type);
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return Address.load(this.store, this.type, context, this.name);
    }

    generateAssignmentIR(value: Value | llvm.Value, context: CodeGenerationContext) {
        assert(this.isAssignable, "Cannot assign to constant global variable");

        let llvmValue = value instanceof llvm.Value ? value : value.generateIR(context);
        context.builder.createAlignedStore(llvmValue, this.store, this.alignment, false);
    }
}

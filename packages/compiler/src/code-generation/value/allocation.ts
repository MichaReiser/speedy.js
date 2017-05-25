import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/types";
import {ObjectReference} from "./object-reference";

import {AssignableValue, Value} from "./value";
import {Pointer} from "./pointer";

/**
 * Wrapper for an allocation with an alignment.
 *
 * Is capable to work with Values and ensures correct alignment
 */
export class Allocation implements AssignableValue {
    static create(type: ts.Type, context: CodeGenerationContext, name?: string): Allocation {
        const allocaInst = Allocation.createAllocaInstInEntryBlock(toLLVMType(type, context), context, name);
        const alignment = Allocation.getPreferredValueAlignment(type, context);
        return new Allocation(allocaInst, type, alignment, name);
    }

    static createAllocaInstInEntryBlock(type: llvm.Type, context: CodeGenerationContext, name?: string) {
        const fn = context.scope.enclosingFunction;
        const entryBlock = fn.getEntryBlock();
        assert(entryBlock, "The function requires an entry block");

        const entryBlockBuilder = new llvm.IRBuilder(fn.getEntryBlock()!);
        const allocation = entryBlockBuilder.createAlloca(type, undefined, name);
        allocation.alignment = this.getPreferredValueAlignment(type, context);
        return allocation;
    }

    static createGlobal(pointer: llvm.GlobalVariable, type: ts.Type, context: CodeGenerationContext, name?: string) {
        assert(pointer.type.isPointerTy(), "Address needs to be a pointer");
        const alignment = Allocation.getPreferredValueAlignment(type, context);
        return new Allocation(pointer, type, alignment, name);
    }

    static getPreferredValueAlignment(type: llvm.Type | ts.Type, context: CodeGenerationContext) {
        type = type instanceof llvm.Type ? type : toLLVMType(type, context);
        return context.module.dataLayout.getPrefTypeAlignment(type);
    }

    private constructor(public store: llvm.Value, public type: ts.Type, public alignment: number, public name?: string) {
    }

    isAssignable(): boolean {
        return !(this.store instanceof llvm.GlobalVariable && this.store.constant);
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(context: CodeGenerationContext): Value {
        if (this.type.flags & ts.TypeFlags.Object) {
            const classReference = context.resolveClass(this.type);
            if (classReference) {
                return classReference.objectFor(new AllocationPointerWrapper(this), this.type as ts.ObjectType, context);
            }
        }

        return context.value(this.generateIR(context), this.type);
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return context.builder.createAlignedLoad(this.store, this.alignment, this.name);
    }

    generateAssignmentIR(value: Value | llvm.Value, context: CodeGenerationContext) {
        assert(this.isAssignable, "Cannot assign to constant global variable");

        let llvmValue = value instanceof llvm.Value ? value : value.generateIR(context);
        context.builder.createAlignedStore(llvmValue, this.store, this.alignment, false);
    }

    castImplicit(type: ts.Type, context: CodeGenerationContext) {
        return this.dereference(context).castImplicit(type, context);
    }
}

/**
 * Wrapper for an allocation that stores an address to use it as pointer
 */
class AllocationPointerWrapper implements Pointer {
    constructor(private allocation: Allocation) {
    }

    get type() {
        return this.allocation.type;
    }

    isPointer(): true {
        return true;
    }

    get(context: CodeGenerationContext): llvm.Value {
        return this.allocation.generateIR(context);
    }

    set(ptr: llvm.Value, context: CodeGenerationContext): void {
        this.allocation.generateAssignmentIR(ptr, context);
    }
}

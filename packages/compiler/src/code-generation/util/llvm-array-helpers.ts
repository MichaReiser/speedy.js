import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {createAllocationInEntryBlock} from "./allocations";

/**
 * Allocates a llvm array in the entry block of the current function and stores the passed in elements in the array
 * @param elements the elements to be stored in the array
 * @param elementType the type of the elements
 * @param context the context
 * @param name the optional name of the allocation
 * @return the allocation
 */
export function allocateLlvmArrayWith(elements: llvm.Value[], elementType: llvm.Type, context: CodeGenerationContext, name?: string): llvm.AllocaInst {
    const fun = context.builder.getInsertBlock().parent!; // TODO Find method to get current function
    const ZERO = llvm.ConstantInt.get(context.llvmContext, 0);

    const allocation = createAllocationInEntryBlock(fun, llvm.ArrayType.get(elementType, elements.length), name);

    // TODO use memcopy if all elements are constant
    for (let i = 0; i < elements.length; ++i) {
        const ptr = context.builder.createInBoundsGEP(allocation, [ZERO, llvm.ConstantInt.get(context.llvmContext, i)]);
        context.builder.createAlignedStore(elements[i], ptr, context.module.dataLayout.getPrefTypeAlignment(elementType));
    }

    return allocation;
}

export function llvmArrayValue(elements: llvm.Value[], elementType: llvm.Type, context: CodeGenerationContext, name?: string): llvm.Value {
    const allocation = allocateLlvmArrayWith(elements, elementType, context, name);
    const ZERO = llvm.ConstantInt.get(context.llvmContext, 0);

    return context.builder.createInBoundsGEP(allocation, [ZERO, ZERO], name);
}

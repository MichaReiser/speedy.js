import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";

/**
 * Allocates a llvm array in the entry block of the current function and stores the passed in elements in the array
 * @param elements the elements to be stored in the array
 * @param elementType the type of the elements
 * @param context the context
 * @param name the optional name of the allocation
 * @return the allocation
 */
function allocateLlvmArrayWith(elements: llvm.Value[], elementType: llvm.Type, context: CodeGenerationContext, name?: string): llvm.Value {
    const ZERO = llvm.ConstantInt.get(context.llvmContext, 0);
    const arrayType = llvm.ArrayType.get(elementType, elements.length);
    const allocation = Allocation.createAllocaInstInEntryBlock(arrayType, context.scope, name);
    const array = context.builder.createInBoundsGEP(allocation, [ZERO, ZERO], name);

    for (let i = 0; i < elements.length; ++i) {
        const ptr = context.builder.createInBoundsGEP(allocation, [ZERO, llvm.ConstantInt.get(context.llvmContext, i)]);
        context.builder.createAlignedStore(elements[i], ptr, context.module.dataLayout.getPrefTypeAlignment(elementType));
    }

    return array;
}

export function llvmArrayValue(elements: llvm.Value[] | ts.Node[], elementType: llvm.Type, context: CodeGenerationContext, name?: string): llvm.Value {
    if (elements.length === 0) {
        return llvm.ConstantPointerNull.get(elementType.getPointerTo());
    }

    let values: llvm.Value[];
    if (elements[0] instanceof llvm.Value) {
        values = elements as llvm.Value[];
    } else {
        values = (elements as ts.Node[]).map(element => context.generateValue(element).generateIR(context));
    }

    return allocateLlvmArrayWith(values, elementType, context, name);

}

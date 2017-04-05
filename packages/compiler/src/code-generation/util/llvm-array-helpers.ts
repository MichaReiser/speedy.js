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

    const areAllElementsConstants = elements.every(value => value instanceof llvm.Constant);
    const array = context.builder.createInBoundsGEP(allocation, [ZERO, ZERO], name);

    if (areAllElementsConstants) {
        assignFromConstantArray(allocation, elements as llvm.Constant[], elementType, context, name);
    } else {
        for (let i = 0; i < elements.length; ++i) {
            const ptr = context.builder.createInBoundsGEP(allocation, [ZERO, llvm.ConstantInt.get(context.llvmContext, i)]);
            context.builder.createAlignedStore(elements[i], ptr, context.module.dataLayout.getPrefTypeAlignment(elementType));
        }
    }

    return array;
}

function assignFromConstantArray(arrayAllocation: llvm.AllocaInst, elements: llvm.Constant[], elementType: llvm.Type, context: CodeGenerationContext, name?: string) {
    const arrayType = llvm.ArrayType.get(elementType, elements.length);
    const array = llvm.ConstantArray.get(arrayType, elements);
    const global = new llvm.GlobalVariable(context.module, array.type, true, llvm.LinkageTypes.PrivateLinkage, array, name || "values");
    global.setUnnamedAddr(llvm.UnnamedAddr.Local);

    const pointerType = llvm.Type.getInt8Ty(context.llvmContext).getPointerTo();
    const arrayValue = context.builder.createBitCast(arrayAllocation, pointerType);
    const globalValue = context.builder.createBitCast(global, pointerType);

    const memcpy = context.module.getOrInsertFunction("llvm.memcpy.p0i8.p0i8.i32", llvm.FunctionType.get(llvm.Type.getVoidTy(context.llvmContext), [pointerType, pointerType, llvm.Type.getInt32Ty(context.llvmContext), llvm.Type.getInt32Ty(context.llvmContext), llvm.Type.getInt1Ty(context.llvmContext)], false));
    context.builder.createCall(memcpy, [
        arrayValue,
        globalValue,
        sizeof(arrayType, context),
        llvm.ConstantInt.get(context.llvmContext, 0),
        llvm.ConstantInt.getFalse(context.llvmContext)
    ]);
}

/**
 * Computes the size of the given type
 * http://stackoverflow.com/questions/14608250/how-can-i-find-the-size-of-a-type
 * @param type the type of which the size is to be computed
 * @param context the code generation context
 * @return {Value} the value containing the size of the type
 */
function sizeof(type: llvm.Type, context: CodeGenerationContext) {
    const size = context.builder.createInBoundsGEP(type, llvm.ConstantPointerNull.get(type.getPointerTo()), [llvm.ConstantInt.get(context.llvmContext, 1)]);
    return context.builder.createPtrToInt(size, llvm.Type.getInt32Ty(context.llvmContext));
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

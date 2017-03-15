import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType, getLLVMArrayType} from "./type-mapping";
import {createAllocationInEntryBlock} from "./allocations";

export class ArrayCodeGeneratorHelper {

    constructor(private context: CodeGenerationContext) {

    }

    static isArrayType(type: ts.Type, context: CodeGenerationContext) {
        return !!type.symbol && (type.symbol.name === "Array" || type.symbol.name === "ArrayConstructor") && !context.scope.hasVariable(type.symbol);
    }

    static isArrayNode(node: ts.Node, context: CodeGenerationContext): boolean {
        const type = context.typeChecker.getTypeAtLocation(node);
        return ArrayCodeGeneratorHelper.isArrayType(type, context);
    }

    static isArrayAccess(node: ts.Node, context: CodeGenerationContext): boolean {
        return node.kind === ts.SyntaxKind.ElementAccessExpression && ArrayCodeGeneratorHelper.isArrayNode((node as ts.ElementAccessExpression).expression, context);
    }

    static getElementTypeFor(type: ts.Type, context: CodeGenerationContext) {
        assert(ArrayCodeGeneratorHelper.isArrayType(type, context), "The given type is not an array type");

        const genericType = type as ts.GenericType;
        assert(genericType.typeArguments.length === 1, "An array type needs to have one type argument, the type of the array elements");

        return genericType.typeArguments[0];
    }

    getElementType(arrayNode: ts.Node) {
        const type = this.context.typeChecker.getTypeAtLocation(arrayNode) as ts.GenericType;
        return ArrayCodeGeneratorHelper.getElementTypeFor(type, this.context);
    }

    /**
     * Creates a new array with the given size
     * @param size the size of the array
     * @param elementType the type of the array elements
     */
    newArray(size: llvm.Value, elementType: ts.Type): llvm.Value;

    /**
     * Creates a new array containing the given elements (and has the size of the given elements)
     * @param elements the elements of the array
     * @param elementType the type of the array elements
     */
    newArray(elements: ts.Node[], elementType: ts.Type): llvm.Value;

    newArray(sizeOrElements: llvm.Value | ts.Node[], elementType: ts.Type): llvm.Value {
        if (Array.isArray(sizeOrElements)) {
            return this.createArrayWithElements(sizeOrElements, elementType);
        }
        return this.createArrayOfSize(sizeOrElements, elementType);
    }

    getElement(arrayPtr: llvm.Value, index: llvm.Value, elementType: ts.Type): llvm.Value {
        // const llvmElementType = toLLVMType(elementType, this.context);
        // const structType = getLLVMArrayType(elementType, this.context);
        //
        // const array = this.context.builder.createInBoundsGEP(arrayPtr, [llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        //
        // const size = this.context.builder.createInBoundsGEP(array, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        // const elements = this.context.builder.createInBoundsGEP(array, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, 2)]);
        //
        // const pointerToIndex = this.context.builder.createInBoundsGEP(elements, [llvm.ConstantInt.get(this.context.llvmContext, 0), index]);
        // return this.context.builder.createLoad(pointerToIndex);

        const getFunction = this.getArrayFunction("array_get", elementType, () => {
            return llvm.FunctionType.get(toLLVMType(elementType, this.context), [getLLVMArrayType(elementType, this.context), llvm.Type.getInt32Ty(this.context.llvmContext)], false);
        });

        return this.context.builder.createCall(getFunction, [arrayPtr, index], "array.get");
    }

    setElement(array: llvm.Value, index: llvm.Value, value: llvm.Value,  elementType: ts.Type): llvm.Value {
        // const array = this.context.builder.createInBoundsGEP(arrayPtr, [llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        //
        // const size = this.context.builder.createInBoundsGEP(array, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        // const elements = this.context.builder.createInBoundsGEP(array, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, 2)]);
        //
        // const pointerToIndex = this.context.builder.createInBoundsGEP(elements, [llvm.ConstantInt.get(this.context.llvmContext, 0), index]);
        // return this.context.builder.createStore(value, pointerToIndex);

        const setFunction = this.getArrayFunction("array_set", elementType, () => {
            return llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [getLLVMArrayType(elementType, this.context), llvm.Type.getInt32Ty(this.context.llvmContext), toLLVMType(elementType, this.context)], false);
        });

        return this.context.builder.createCall(setFunction, [array, index, value ]);
    }

    getLength(arrayPtr: llvm.Value, elementType: ts.Type): llvm.Value {
        // const array = this.context.builder.createInBoundsGEP(arrayPtr, [llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        //
        // const size = this.context.builder.createInBoundsGEP(array, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, 0)]);
        // return this.context.builder.createLoad(size, "size");
        const lengthFunction = this.getArrayFunction("array_length", elementType, () => {
            return llvm.FunctionType.get(llvm.Type.getInt32Ty(this.context.llvmContext), [getLLVMArrayType(elementType, this.context)], false);
        });

        return this.context.builder.createCall(lengthFunction, [arrayPtr], "array.length");
    }

    // push...

    private createArrayOfSize(size: llvm.Value, elementType: ts.Type): llvm.Value {
        return this.createNewArray(size, elementType);
    }

    private createArrayWithElements(elements: ts.Node[], elementType: ts.Type): llvm.Value {
        const allocation = this.createArrayAllocation(elements.length, elementType);
        this.addArrayElements(elements, allocation);

        return this.createNewArray(llvm.ConstantInt.get(this.context.llvmContext, elements.length ), elementType, allocation);
    }

    private addArrayElements(elements: ts.Node[], arrayAllocation: llvm.Value) {
        // TODO use Constant Array and memcpy if all elements are constants
        for (let i = 0; i < elements.length; ++i) {
            const elementValue = this.context.generate(elements[i]);
            const elementIndex = this.context.builder.createInBoundsGEP(arrayAllocation, [llvm.ConstantInt.get(this.context.llvmContext, 0), llvm.ConstantInt.get(this.context.llvmContext, i)]);
            this.context.builder.createStore(elementValue, elementIndex, false);
        }
    }

    private createArrayAllocation(size: number, elementType: ts.Type) {
        const arrayType = llvm.ArrayType.get(toLLVMType(elementType, this.context), size);
        return createAllocationInEntryBlock(this.context.builder.getInsertBlock().parent!, arrayType, "[ ... ]");
    }

    private createNewArray(size: llvm.Value, elementType: ts.Type, elementsArrayAllocation?: llvm.AllocaInst) {
        const newArrayFunction = this.getNewArrayFunction(elementType);

        let elementsPtr: llvm.Value;
        if (elementsArrayAllocation) {
            const LLVM_ZERO = llvm.ConstantInt.get(this.context.llvmContext, 0);
            elementsPtr = this.context.builder.createInBoundsGEP(elementsArrayAllocation, [LLVM_ZERO, LLVM_ZERO], "array")
        } else {
            elementsPtr = llvm.ConstantPointerNull.get(toLLVMType(elementType, this.context).getPointerTo());
        }

        const args = [
            size,
            elementsPtr
        ];

        return this.context.builder.createCall(newArrayFunction, args);
    }

    private getNewArrayFunction(elementType: ts.Type): llvm.Function {
        return this.getArrayFunction("new_array", elementType, () => {
            const llvmElementType = toLLVMType(elementType, this.context);

            const arrayType = getLLVMArrayType(elementType, this.context);
            return llvm.FunctionType.get(arrayType, [llvm.Type.getInt32Ty(this.context.llvmContext), llvmElementType.getPointerTo()], false);
            // return llvm.FunctionType.get(llvm.Type.getInt8PtrTy(this.context.llvmContext), [llvm.Type.getInt32Ty(this.context.llvmContext), llvmElementType.getPointerTo()], false);
        });
    }

    private getArrayFunction(name: string, elementType: ts.Type, signatureFactory: () => llvm.FunctionType): llvm.Function {
        const fullName = `${name}_${this.getArrayFunctionPostfix(elementType)}`;

        let fun: llvm.Function | undefined = this.context.module.getFunction(fullName);
        if (!fun) {
            const type = signatureFactory();
            fun = llvm.Function.create(type, llvm.LinkageTypes.ExternalLinkage, fullName, this.context.module);
        }

        // fun.addFnAttr("alwaysinline");
        return fun;
    }

    private getArrayFunctionPostfix(elementType: ts.Type): string | never {
        if (elementType.flags & ts.TypeFlags.IntLike) {
            return "i32";
        }

        if (elementType.getFlags() & ts.TypeFlags.BooleanLike) {
            return "i1";
        }

        if (elementType.getFlags() & ts.TypeFlags.Number) {
            return "f64";
        }

        if (elementType.getFlags() & ts.TypeFlags.Object) {
            return "ptr";
        }

        throw new Error(`Unsupported Element Type for Array`);
    }

    delete(array: llvm.AllocaInst, elementType: ts.Type) {
        const deleteFunction = this.getArrayFunction("delete_array", elementType, () => {
            return llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [getLLVMArrayType(elementType, this.context)], false);
        });

        this.context.builder.createCall(deleteFunction, [this.context.builder.createLoad(array)]);
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "./type-mapping";
import {isNode} from "../../util/instance-tests";
import {llvmArrayValue, allocateLlvmArrayWith} from "./llvm-array-helpers";

export class ArrayCodeGenerator {
    private llvmArrayType: llvm.Type;
    private llvmElementType: llvm.Type;
    private sizeType: llvm.Type;

    private constructor(private context: CodeGenerationContext, private elementType: ts.Type) {
        this.sizeType = llvm.Type.getInt32Ty(context.llvmContext);
        this.llvmArrayType = ArrayCodeGenerator.getLLVMArrayType(context);
        this.llvmElementType = toLLVMType(elementType, context);
    }

    static create(elementTypeOrNode: ts.Type | ts.Node, context: CodeGenerationContext) {
        let elementType: ts.Type;
        if (isNode(elementTypeOrNode)) {
            elementType = ArrayCodeGenerator.getElementType(elementTypeOrNode, context);
        } else {
            elementType = ArrayCodeGenerator.getElementTypeFor(elementTypeOrNode, context);
        }

        return new ArrayCodeGenerator(context, elementType);
    }

    static isArrayType(type: ts.Type, context: CodeGenerationContext) {
        return !!type.symbol && (type.symbol.name === "Array" || type.symbol.name === "ArrayConstructor") && !context.scope.hasVariable(type.symbol);
    }

    static isArrayNode(node: ts.Node, context: CodeGenerationContext): boolean {
        const type = context.typeChecker.getTypeAtLocation(node);
        return ArrayCodeGenerator.isArrayType(type, context);
    }

    static isArrayAccess(node: ts.Node, context: CodeGenerationContext): boolean {
        return node.kind === ts.SyntaxKind.ElementAccessExpression && ArrayCodeGenerator.isArrayNode((node as ts.ElementAccessExpression).expression, context);
    }

    static getElementTypeFor(type: ts.Type, context: CodeGenerationContext) {
        assert(ArrayCodeGenerator.isArrayType(type, context), "The given type is not an array type");

        const genericType = type as ts.GenericType;
        assert(genericType.typeArguments.length === 1, "An array type needs to have one type argument, the type of the array elements");

        return genericType.typeArguments[0];
    }

    static getLLVMArrayType(context: CodeGenerationContext) {
        return llvm.Type.getIntNTy(context.llvmContext, context.module.dataLayout.getPointerSize(0)).getPointerTo();
    }

    static getElementType(arrayNode: ts.Node, context: CodeGenerationContext) {
        const type = context.typeChecker.getTypeAtLocation(arrayNode) as ts.GenericType;
        return ArrayCodeGenerator.getElementTypeFor(type, context);
    }

    /**
     * Creates a new array with the given size
     * @param size the size of the array
     */
    newArray(size: llvm.Value): llvm.Value;

    /**
     * Creates a new array containing the given elements (and has the size of the given elements)
     * @param elements the elements of the array
     */
    newArray(elements: ts.Node[]): llvm.Value;

    newArray(sizeOrElements: llvm.Value | ts.Node[]): llvm.Value {
        if (Array.isArray(sizeOrElements)) {
            return this.createArrayWithElements(sizeOrElements);
        }
        return this.createNewArray(sizeOrElements);
    }

    /**
     * Inserts the instruction that reads the element at the given position from the array.
     * @param arrayPtr the array
     * @param index the index to access
     * @return the element value
     */
    getElement(arrayPtr: llvm.Value, index: llvm.Value): llvm.Value {
        const getFunction = this.getArrayFunction("array_get", () => llvm.FunctionType.get(this.llvmElementType, [this.llvmArrayType, this.sizeType], false));
        return this.context.builder.createCall(getFunction, [arrayPtr, index], "array.get");
    }

    /**
     * Inserts the instruction that sets the value of the element at the given position to the given value
     * @param array the array
     * @param index the index of the element to change
     * @param value the value to set
     * @return void value
     */
    setElement(array: llvm.Value, index: llvm.Value, value: llvm.Value): llvm.Value {
        const setFunction = this.getArrayFunction("array_set", () => llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [ this.llvmArrayType, this.sizeType, this.llvmElementType], false));
        return this.context.builder.createCall(setFunction, [array, index, value ]);
    }

    /**
     * Inserts the instruction to fill the array elements with the given value
     * @param arrayPtr the array to fill
     * @param value the value to set
     * @param start the start position from where the value should be set
     * @param end the end position
     * @return the array
     */
    fill(arrayPtr: llvm.Value, value: llvm.Value, start?: llvm.Value, end?: llvm.Value) {
        start = start || llvm.ConstantInt.get(this.context.llvmContext, 0);

        if (end) {
            const fill3 = this.getArrayFunction("array_fill_iii", () => llvm.FunctionType.get(this.llvmArrayType, [this.llvmArrayType, this.llvmElementType, this.sizeType, this.sizeType], false));
            return this.context.builder.createCall(fill3, [arrayPtr, value, start, end]);
        }

        const fill2 = this.getArrayFunction("array_fill_ii", () => llvm.FunctionType.get(this.llvmArrayType, [this.llvmArrayType, this.llvmElementType, this.sizeType], false));
        return this.context.builder.createCall(fill2, [arrayPtr, value, start]);
    }

    /**
     * Inserts the instruction that gets the length of the array
     * @param arrayPtr the array
     * @return the instruction that gets the length of the array
     */
    getLength(arrayPtr: llvm.Value): llvm.Value {
        const lengthFunction = this.getArrayFunction("array_length", () => llvm.FunctionType.get(this.sizeType, [ this.llvmArrayType], false));
        return this.context.builder.createCall(lengthFunction, [arrayPtr], "array.length");
    }

    /**
     * Inserts the instruction that changes the length of the array
     * @param arrayPtr the array
     * @param length the length to set
     * @return void value
     */
    setLength(arrayPtr: llvm.Value, length: llvm.Value): llvm.Value {
        const setLengthFunction = this.getArrayFunction("array_set_length", () => llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [ this.llvmArrayType, this.sizeType ], false));
        return this.context.builder.createCall(setLengthFunction, [arrayPtr, length]);
    }

    /**
     * Inserts the instruction that pops the top element of the array and removes it
     * @param arrayPtr the array
     * @return the value of the removed element
     */
    pop(arrayPtr: llvm.Value): llvm.Value {
        const popFunction = this.getArrayFunction("array_pop", () => llvm.FunctionType.get(this.llvmElementType, [ this.llvmArrayType], false));
        return this.context.builder.createCall(popFunction, [arrayPtr], "array.top");
    }

    /**
     * Inserts the instruction that pushes the given elements at the end of the array
     * @param arrayPtr the array
     * @param values the elements to add
     * @return the new length of the array
     */
    push(arrayPtr: llvm.Value, values: llvm.Value[]): llvm.Value {
        const pushFunction = this.getArrayFunction("array_push", () => llvm.FunctionType.get(this.sizeType, [ this.llvmArrayType, this.llvmElementType.getPointerTo(), this.sizeType], false));
        const elementsArray = llvmArrayValue(values, this.llvmElementType, this.context);
        return this.context.builder.createCall(pushFunction, [arrayPtr, elementsArray, llvm.ConstantInt.get(this.context.llvmContext, values.length)]);
    }

    /**
     * Inserts the instruction that returns and removes the first element of the array
     * @param arrayPtr the array
     * @return the removed element
     */
    shift(arrayPtr: llvm.Value): llvm.Value {
        const shiftFunction = this.getArrayFunction("array_shift", () => llvm.FunctionType.get(this.llvmElementType, [ this.llvmArrayType ], false));
        return this.context.builder.createCall(shiftFunction, [ arrayPtr ], "array.first");
    }

    /**
     * Inserts the instruction that inserts the given elements at the beginning of the array
     * @param arrayPtr the array
     * @param values the elements to insert
     * @return the new length of the array
     */
    unshift(arrayPtr: llvm.Value, values: llvm.Value[]): llvm.Value {
        const unshiftFunction = this.getArrayFunction("array_unshift", () => llvm.FunctionType.get(this.sizeType, [ this.llvmArrayType, this.llvmElementType.getPointerTo(), this.sizeType], false));
        const elementsArray = llvmArrayValue(values, this.llvmElementType, this.context);
        return this.context.builder.createCall(unshiftFunction, [ arrayPtr, elementsArray, llvm.ConstantInt.get(this.context.llvmContext, values.length)]);
    }

    /**
     * Inserts the instruction that releases the memory allocated by the array
     * @param array the array to release
     */
    free(array: llvm.AllocaInst) {
        const deleteFunction = this.getArrayFunction("delete_array", () => llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [this.llvmArrayType], false));
        this.context.builder.createCall(deleteFunction, [this.context.builder.createLoad(array)]);
    }

    /**
     * Invokes the function defined by the given property expression with the given values
     * @param propertyAccessExpression the property that defines the array method
     * @param args the args. The number of arguments must be valid for the invoked method
     * @return the result of the method invocation
     */
    invoke(propertyAccessExpression: ts.PropertyAccessExpression, args: llvm.Value[]): llvm.Value {
        const array = this.context.generate(propertyAccessExpression.expression);

        switch (propertyAccessExpression.name.text) {
            case "pop":
                return this.pop(array);
            case "shift":
                return this.shift(array);
            case "fill":
                return this.fill.apply(this, [array, ...args]);
            case "push":
                return this.push(array, args);
            case "unshift":
                return this.unshift(array, args);
            default:
                throw new Error(`Unsupported Array operation ${propertyAccessExpression.name.text}`);
        }
    }

    private createArrayWithElements(elements: ts.Node[]): llvm.Value {
        const elementValues = elements.map(element => this.context.generate(element));
        const elementsArray = allocateLlvmArrayWith(elementValues, this.llvmElementType, this.context);
        return this.createNewArray(llvm.ConstantInt.get(this.context.llvmContext, elements.length ), elementsArray);
    }

    private createNewArray(size: llvm.Value, elementsArrayAllocation?: llvm.AllocaInst) {
        let elementsPtr: llvm.Value;
        if (elementsArrayAllocation) {
            const LLVM_ZERO = llvm.ConstantInt.get(this.context.llvmContext, 0);
            elementsPtr = this.context.builder.createInBoundsGEP(elementsArrayAllocation, [LLVM_ZERO, LLVM_ZERO], "array")
        } else {
            elementsPtr = llvm.ConstantPointerNull.get(this.llvmElementType.getPointerTo());
        }

        const args = [
            size,
            elementsPtr
        ];

        const newArrayFunction = this.getArrayFunction("new_array", () => llvm.FunctionType.get(this.llvmArrayType, [this.sizeType, this.llvmElementType.getPointerTo()], false));
        return this.context.builder.createCall(newArrayFunction, args);
    }

    private getArrayFunction(name: string, signatureFactory: () => llvm.FunctionType): llvm.Function {
        const fullName = `${name}_${this.getArrayFunctionPostfix()}`;

        let fun: llvm.Function | undefined = this.context.module.getFunction(fullName);
        if (!fun) {
            const type = signatureFactory();
            fun = llvm.Function.create(type, llvm.LinkageTypes.ExternalLinkage, fullName, this.context.module);
        }

        return fun;
    }

    private getArrayFunctionPostfix(): string | never {
        if (this.elementType.flags & ts.TypeFlags.IntLike) {
            return "i32";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.BooleanLike) {
            return "i1";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.Number) {
            return "f64";
        }

        if (this.elementType.getFlags() & ts.TypeFlags.Object) {
            return "ptr";
        }

        throw new Error(`Unsupported Element Type for Array`);
    }
}

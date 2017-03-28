import * as ts from "typescript";
import * as llvm from "llvm-node";

import {CodeGenerationContext} from "../code-generation-context";
import {ClassReference} from "./class-reference";
import {ObjectReference} from "./object-reference";
import {MathObjectReference} from "./math-object-reference";
import {Allocation} from "../value/allocation";
import {FunctionReference} from "./function-reference";

export class MathClassReference extends ClassReference {
    private constructor(typeInformation: llvm.GlobalVariable, symbol: ts.Symbol, context: CodeGenerationContext) {
        super(typeInformation, symbol, context);
    }

    static create(symbol: ts.Symbol, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(symbol, context);
        return new MathClassReference(typeInformation, symbol, context);
    }

    /**
     * Creates the global Math object
     * @param symbol the symbol of the math object
     * @return {Allocation} the allocation of the global math object
     */
    createGlobalVariable(symbol: ts.Symbol) {
        const mathType = this.context.typeChecker.getDeclaredTypeOfSymbol(symbol) as ts.ObjectType;
        const structType = this.getObjectType(mathType);
        const struct = llvm.ConstantStruct.get(structType, [this.typeInformation]);

        const storage = new llvm.GlobalVariable(this.context.module, structType, true, llvm.LinkageTypes.PrivateLinkage, struct, "Math_object");
        const ptr = new llvm.GlobalVariable(this.context.module, structType.getPointerTo(), true, llvm.LinkageTypes.PrivateLinkage, storage, "Math_ptr");

        return new Allocation(ptr, mathType, this.context, "mathPtr");
    }

    getFields() {
        return [];
    }

    getConstructor(): FunctionReference {
        throw new Error(`Math object cannot be instantiated`);
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType): ObjectReference {
        return new MathObjectReference(pointer, type, this.context);
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";

import {CodeGenerationContext} from "../code-generation-context";
import {ClassReference} from "./class-reference";
import {ObjectReference} from "./object-reference";
import {MathObjectReference} from "./math-object-reference";
import {Allocation} from "./allocation";
import {FunctionReference} from "./function-reference";
import {CompilationContext} from "../../compilation-context";

export class MathClassReference extends ClassReference {
    private constructor(typeInformation: llvm.GlobalVariable, symbol: ts.Symbol, compilationContext: CompilationContext) {
        super(typeInformation, symbol, compilationContext);
    }

    static create(symbol: ts.Symbol, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(symbol, context);
        return new MathClassReference(typeInformation, symbol, context.compilationContext);
    }

    /**
     * Creates the global Math object
     * @param symbol the symbol of the math object
     * @param context the code generation context
     * @return {Allocation} the allocation of the global math object
     */
    createGlobalVariable(symbol: ts.Symbol, context: CodeGenerationContext) {
        const mathType = context.typeChecker.getDeclaredTypeOfSymbol(symbol) as ts.ObjectType;
        const structType = this.getObjectType(mathType, context);
        const struct = llvm.ConstantStruct.get(structType, [this.typeInformation]);

        const storage = new llvm.GlobalVariable(context.module, structType, true, llvm.LinkageTypes.PrivateLinkage, struct, "Math_object");
        const ptr = new llvm.GlobalVariable(context.module, structType.getPointerTo(), true, llvm.LinkageTypes.PrivateLinkage, storage, "Math_ptr");

        return Allocation.forGlobalVariable(ptr, mathType, context, "mathPtr");
    }

    getFields() {
        return [];
    }

    getConstructor(): FunctionReference {
        throw new Error(`Math object cannot be instantiated`);
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType): ObjectReference {
        return new MathObjectReference(pointer, type, this);
    }
}

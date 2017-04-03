import * as ts from "typescript"
import * as llvm from "llvm-node";

import {Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {FunctionReference} from "./function-reference";
import {CompilationContext} from "../../compilation-context";

/**
 * Reference to a class (or in JS, to the constructor function)
 */
export abstract class ClassReference implements Value {

    /**
     * Creates a new instance
     * @param typeInformation a pointer to the type information of the class
     * @param symbol the symbol for this class
     * @param compilationContext the compilationContext
     */
    protected constructor(protected typeInformation: llvm.GlobalVariable, public symbol: ts.Symbol, protected compilationContext: CompilationContext) {
    }

    /**
     * Creates a new type descriptor for the given symbol
     * @param symbol the symbol
     * @param context the context
     * @return {llvm.GlobalVariable} a global variable that stores the type descriptor
     */
    protected static createTypeDescriptor(symbol: ts.Symbol, context: CodeGenerationContext) {
        const name = llvm.ConstantDataArray.getString(context.llvmContext, symbol.name);
        const nameVariable = new llvm.GlobalVariable(context.module, name.type, true, llvm.LinkageTypes.PrivateLinkage, name, `${symbol.name}_name`);
        nameVariable.setUnnamedAddr(llvm.UnnamedAddr.Global);

        const structType = llvm.StructType.get(context.llvmContext, [ name.type.getPointerTo() ], false);
        const struct = llvm.ConstantStruct.get(structType, [nameVariable]);

        return new llvm.GlobalVariable(context.module, struct.type, true, llvm.LinkageTypes.PrivateLinkage, struct, `${symbol.name}_type_descriptor`);
    }

    get name() {
        return this.symbol.name;
    }

    get type(): ts.Type  {
        return this.compilationContext.typeChecker.getDeclaredTypeOfSymbol(this.symbol);
    }

    generateIR(): llvm.Value {
        return this.typeInformation;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    isAssignable() {
        return false;
    }

    dereference() {
        return this;
    }

    getLLVMType(type: ts.ObjectType, context: CodeGenerationContext): llvm.Type {
        return this.getObjectType(type).getPointerTo();
    }

    /**
     * Returns the fields of the class instances
     * @param type the specific instantiated type of the class
     * @returns the type of the object fields
     */
    protected abstract getFields(type: ts.Type): llvm.Type[];

    /**
     * Returns the reference to the constructor function
     * @param newExpression the call to the constructor
     * @param context the context
     */
    abstract getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference;

    /**
     * Returns a reference to the object instance stored in the given pointer
     * @param pointer the address where the object is stored
     * @param type the type of the object
     * @param context the context
     */
    abstract objectFor(pointer: llvm.Value, type: ts.ObjectType, context: CodeGenerationContext): ObjectReference;

    /**
     * Creates the type of the object
     * @param type the type
     * @return {StructType} the llvm type of the object
     */
    protected getObjectType(type: ts.ObjectType) {
        return llvm.StructType.get(this.compilationContext.llvmContext, [
            this.typeInformation.type,
            ...this.getFields(type)
        ]);
    }
}

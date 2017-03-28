import * as ts from "typescript"
import * as llvm from "llvm-node";

import {Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {FunctionReference} from "./function-reference";

export abstract class ClassReference implements Value {

    protected constructor(protected typeInformation: llvm.GlobalVariable, public symbol: ts.Symbol, protected context: CodeGenerationContext) {
    }

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

    getLLVMType(type: ts.ObjectType): llvm.Type {
        return this.getObjectType(type).getPointerTo();
    }

    protected abstract getFields(type: ts.Type): llvm.Type[];

    abstract getConstructor(newExpression: ts.NewExpression): FunctionReference;

    abstract objectFor(pointer: llvm.Value, type: ts.ObjectType): ObjectReference;

    protected getObjectType(type: ts.ObjectType) {
        return llvm.StructType.get(this.context.llvmContext, [
            this.typeInformation.type,
            ...this.getFields(type)
        ]);
    }
}

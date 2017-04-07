import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "../value/object-reference";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {toLLVMType} from "./types";
import {ObjectIndexReference} from "../value/object-index-reference";
import {DefaultNameMangler} from "../default-name-mangler";

export class ObjectIndexReferenceBuilder {
    private runtimeFn = false;

    private constructor(private element: ts.ElementAccessExpression, private context: CodeGenerationContext) {
    }

    static forElement(element: ts.ElementAccessExpression, context: CodeGenerationContext) {
        return new ObjectIndexReferenceBuilder(element, context);
    }

    get indexType() {
        return llvm.Type.getInt32Ty(this.context.llvmContext);
    }

    fromRuntime() {
        this.runtimeFn = true;
        return this;
    }

    build(objectReference: ObjectReference) {
        const elementType = this.context.typeChecker.getTypeAtLocation(this.element);
        const llvmElementType = toLLVMType(elementType, this.context);
        const llvmThisType = toLLVMType(objectReference.type, this.context);

        const getter = this.createGetter(llvmThisType, llvmElementType);
        const setter = this.createSetter(llvmThisType, llvmElementType);

        const index = this.context.generateValue(this.element.argumentExpression!);

        return new ObjectIndexReference(elementType, objectReference, index, getter, setter);
    }

    private getNameMangler() {
        return this.runtimeFn ? new RuntimeSystemNameMangler(this.context.compilationContext) : new DefaultNameMangler(this.context.compilationContext);
    }

    private createGetter(thisType: llvm.Type, elementType: llvm.Type): llvm.Function {
        const getterName = this.getNameMangler().mangleIndexer(this.element, false);
        let getter = this.context.module.getFunction(getterName);

        if (!getter) {
            const getterType = llvm.FunctionType.get(elementType, [thisType, this.indexType], false);
            getter = llvm.Function.create(getterType, llvm.LinkageTypes.ExternalLinkage, getterName, this.context.module);
        }

        return getter;
    }

    private createSetter(thisType: llvm.Type, elementType: llvm.Type): llvm.Function {
        const setterName = this.getNameMangler().mangleIndexer(this.element, true);
        let setter = this.context.module.getFunction(setterName);

        if (!setter) {
            const setterType = llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [thisType, this.indexType, elementType], false);
            setter = llvm.Function.create(setterType, llvm.LinkageTypes.ExternalLinkage, setterName, this.context.module);
        }

        return setter;
    }
}

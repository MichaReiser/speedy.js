import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {ObjectIndexReference} from "../value/object-index-reference";
import {ObjectReference} from "../value/object-reference";
import {TypePlace} from "./typescript-to-llvm-type-converter";

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

    get typeConverter() {
        return this.runtimeFn ? this.context.runtimeTypeConverter : this.context.typeConverter;
    }

    fromRuntime() {
        this.runtimeFn = true;
        return this;
    }

    build(objectReference: ObjectReference) {
        const elementType = this.context.typeChecker.getTypeAtLocation(this.element);
        const llvmThisType = this.typeConverter.convert(objectReference.type, TypePlace.THIS);

        const getter = this.createGetter(llvmThisType, elementType, objectReference);
        const setter = this.createSetter(llvmThisType, elementType, objectReference);

        const index = this.context.generateValue(this.element.argumentExpression!);

        return new ObjectIndexReference(elementType, objectReference, index, getter, setter);
    }

    private getNameMangler() {
        return this.runtimeFn ? new RuntimeSystemNameMangler(this.context.compilationContext) : new DefaultNameMangler(this.context.compilationContext);
    }

    private createGetter(thisType: llvm.Type, elementType: ts.Type, objectReference: ObjectReference): llvm.Function {
        const getterName = this.getNameMangler().mangleIndexer(this.element, false);
        let getter = this.context.module.getFunction(getterName);

        if (!getter) {
            const getterType = llvm.FunctionType.get(this.typeConverter.convert(elementType, TypePlace.RETURN_VALUE), [thisType, this.indexType], false);
            getter = llvm.Function.create(getterType, llvm.LinkageTypes.ExternalLinkage, getterName, this.context.module);
            getter.addFnAttr(llvm.Attribute.AttrKind.ReadOnly);
            getter.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);
            getter.addFnAttr(llvm.Attribute.AttrKind.NoUnwind);
            getter.addFnAttr(llvm.Attribute.AttrKind.NoRecurse);

            const self = getter.getArguments()[0];
            self.addDereferenceableAttr(objectReference.getTypeStoreSize(this.context));
            self.addAttr(llvm.Attribute.AttrKind.NoCapture);
        }

        return getter;
    }

    private createSetter(thisType: llvm.Type, elementType: ts.Type, objectReference: ObjectReference): llvm.Function {
        const setterName = this.getNameMangler().mangleIndexer(this.element, true);
        let setter = this.context.module.getFunction(setterName);

        if (!setter) {
            const llvmElementType = this.typeConverter.convert(elementType, TypePlace.PARAMETER);
            const setterType = llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [thisType, this.indexType, llvmElementType], false);
            setter = llvm.Function.create(setterType, llvm.LinkageTypes.ExternalLinkage, setterName, this.context.module);
            setter.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);

            const self = setter.getArguments()[0];
            self.addDereferenceableAttr(objectReference.getTypeStoreSize(this.context));
            self.addAttr(llvm.Attribute.AttrKind.NoCapture);
        }

        return setter;
    }
}

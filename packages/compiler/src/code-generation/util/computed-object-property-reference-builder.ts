import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {ObjectPropertyReference} from "../value/object-property-reference";
import {ObjectReference} from "../value/object-reference";
import {toLLVMType} from "./types";

export class ComputedObjectPropertyReferenceBuilder {
    private runtimeFn = false;
    private _readonly = false;

    private constructor(private property: ts.PropertyAccessExpression, private context: CodeGenerationContext) {
    }

    static forProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        return new ComputedObjectPropertyReferenceBuilder(property, context);
    }

    fromRuntime() {
        this.runtimeFn = true;
        return this;
    }

    readonly(isReadonly = true) {
        this._readonly = isReadonly;
        return this;
    }

    build(objectReference: ObjectReference) {
        const propertyType = this.context.typeChecker.getTypeAtLocation(this.property);
        const property = this.context.typeChecker.getSymbolAtLocation(this.property);
        const propertyLLVMType = toLLVMType(propertyType, this.context);
        const thisLLVMType = toLLVMType(objectReference.type, this.context);

        const getter = this.createGetter(thisLLVMType, propertyLLVMType);
        let setter: llvm.Function | undefined;

        if (!this._readonly) {
            setter = this.createSetter(thisLLVMType, propertyLLVMType);
        }

        return ObjectPropertyReference.createComputedPropertyReference(propertyType, objectReference, property, getter, setter);
    }

    private getNameMangler() {
        return this.runtimeFn ? new RuntimeSystemNameMangler(this.context.compilationContext) : new DefaultNameMangler(this.context.compilationContext);
    }

    private createGetter(thisType: llvm.Type, propertyType: llvm.Type): llvm.Function {
        const getterName = this.getNameMangler().mangleProperty(this.property, false);

        let getter = this.context.module.getFunction(getterName);

        if (!getter) {
            const getterType = llvm.FunctionType.get(propertyType, [thisType], false);
            getter = llvm.Function.create(getterType, llvm.LinkageTypes.ExternalLinkage, getterName, this.context.module);
            getter.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);
            getter.addFnAttr(llvm.Attribute.AttrKind.ReadOnly);
            getter.addFnAttr(llvm.Attribute.AttrKind.NoUnwind);

            const self = getter.getArguments()[0];
            self.addAttr(llvm.Attribute.AttrKind.ReadOnly);
            self.addAttr(llvm.Attribute.AttrKind.NoCapture);
        }

        return getter;
    }

    private createSetter(thisType: llvm.Type, propertyType: llvm.Type): llvm.Function {
        const setterName = this.getNameMangler().mangleProperty(this.property, true);

        let setter = this.context.module.getFunction(setterName);

        if (!setter) {
            const setterType = llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [thisType, propertyType], false);
            setter = llvm.Function.create(setterType, llvm.LinkageTypes.ExternalLinkage, setterName, this.context.module);
            setter.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);

            const self = setter.getArguments()[0];
            self.addAttr(llvm.Attribute.AttrKind.ReadOnly);
            self.addAttr(llvm.Attribute.AttrKind.NoCapture);
        }

        return setter;
    }
}

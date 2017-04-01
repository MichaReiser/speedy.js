import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {toLLVMType} from "../util/types";
import {ObjectPropertyReference} from "./object-property-reference";
import {DefaultNameMangler} from "../default-name-mangler";

export class ObjectPropertyReferenceBuilder {
    private runtimeFn = false;

    private constructor(private property: ts.PropertyAccessExpression, private context: CodeGenerationContext) {
    }

    static forProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        return new ObjectPropertyReferenceBuilder(property, context);
    }

    fromRuntime() {
        this.runtimeFn = true;
        return this;
    }

    build(objectReference: ObjectReference) {
        const propertyType = this.context.typeChecker.getTypeAtLocation(this.property);
        const propertyLLVMType = toLLVMType(propertyType, this.context);
        const thisLLVMType = toLLVMType(objectReference.type, this.context);

        const getter = this.createGetter(thisLLVMType, propertyLLVMType);
        const setter = this.createSetter(thisLLVMType, propertyLLVMType);

        return new ObjectPropertyReference(propertyType, objectReference, getter, setter);
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
        }

        return getter;
    }

    private createSetter(thisType: llvm.Type, propertyType: llvm.Type): llvm.Function {
        const setterName = this.getNameMangler().mangleProperty(this.property, true);

        let setter = this.context.module.getFunction(setterName);

        if (!setter) {
            const setterType = llvm.FunctionType.get(llvm.Type.getVoidTy(this.context.llvmContext), [thisType, propertyType], false);
            setter = llvm.Function.create(setterType, llvm.LinkageTypes.ExternalLinkage, setterName, this.context.module);
        }

        return setter;
    }
}

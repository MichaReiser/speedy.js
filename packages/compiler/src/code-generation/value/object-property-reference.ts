import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value, AssignableValue} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "./address";

/**
 * Reference to an object property (x.name)
 */
export abstract class ObjectPropertyReference implements AssignableValue {

    /**
     * Creates a computed property
     * @param propertyType the type of the property
     * @param object the objec to which the property belongs
     * @param getter the getter to access the property
     * @param setter the setter to change the value of the property
     * @return the property reference
     */
    static createComputedPropertyReference(propertyType: ts.Type, object: ObjectReference, getter: llvm.Function | undefined, setter: llvm.Function | undefined) {
        return new ComputedObjectPropertyReference(propertyType, object, getter, setter);
    }

    static createFieldProperty(propertyType: ts.Type, object: ObjectReference, property: ts.Symbol) {
        const fieldIndex = object.clazz.getFieldIndex(property);

        return new ObjectFieldPropertyReference(propertyType, object, property, fieldIndex);
    }

    protected constructor(public propertyType: ts.Type, protected object: ObjectReference) {
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.getValue(context).generateIR(context);
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        this.setValue(value, context);
    }

    /**
     * Returns the value of the property
     * @param context the context
     */
    protected abstract getValue(context: CodeGenerationContext): Value;

    /**
     * Sets the value of the property
     * @param value the value to set
     * @param context the context
     */
    protected abstract setValue(value: Value, context: CodeGenerationContext): void;

    /**
     * Indicator if the property is assignable or not
     */
    abstract isAssignable(): boolean;

    isObject(): this is ObjectReference {
        return false;
    }

    dereference() {
        return this;
    }
}

/**
 * Backs a computed property, e.g. one that is implemented using get index() or one that resits in the runtime
 */
class ComputedObjectPropertyReference extends ObjectPropertyReference {
    constructor(propertyType: ts.Type, object: ObjectReference, private getter: llvm.Function | undefined, private setter: llvm.Function | undefined) {
        super(propertyType, object);
    }

    protected getValue(context: CodeGenerationContext): Value {
        return context.call(this.getter!, [this.object], this.propertyType)!;
    }

    protected setValue(value: Value, context: CodeGenerationContext): void {
        context.call(this.setter!, [this.object, value], this.propertyType);
    }

    isAssignable(): boolean {
        return !!this.setter;
    }
}

/**
 * Backs a property that dispatches directly to an object field
 */
class ObjectFieldPropertyReference extends ObjectPropertyReference {

    constructor(propertyType: ts.Type, object: ObjectReference, private property: ts.Symbol, private fieldIndex: number) {
        super(propertyType, object);
    }

    protected getValue(context: CodeGenerationContext): Value {
        const alignment = Address.getPreferredAlignment(this.propertyType, context);
        const value = context.builder.createAlignedLoad(this.getFieldAddress(context), alignment, this.property.name);
        return context.value(value, this.propertyType);
    }

    protected setValue(value: Value, context: CodeGenerationContext): void {
        const alignment = Address.getPreferredAlignment(this.propertyType, context);
        context.builder.createAlignedStore(value.generateIR(context), this.getFieldAddress(context), alignment);
    }

    isAssignable(): boolean {
        return true;
    }

    private getFieldAddress(context: CodeGenerationContext) {
        const fieldIndex = llvm.ConstantInt.get(context.llvmContext, this.object.clazz.getFieldsOffset() + this.fieldIndex);
        return context.builder.createInBoundsGEP(this.object.generateIR(context), [ llvm.ConstantInt.get(context.llvmContext, 0), fieldIndex ], `&${this.property.name}`);
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value, AssignableValue} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "./allocation";

/**
 * Reference to an object property (x.name)
 */
export abstract class ObjectPropertyReference implements AssignableValue {

    /**
     * Creates a computed property
     * @param propertyType the type of the property
     * @param object the object to which the property belongs
     * @param property the property symbol
     * @param getter the getter to access the property
     * @param setter the setter to change the value of the property
     * @return the property reference
     */
    static createComputedPropertyReference(propertyType: ts.Type, object: ObjectReference, property: ts.Symbol, getter: llvm.Function | undefined, setter: llvm.Function | undefined) {
        return new ComputedObjectPropertyReference(propertyType, object, property, getter, setter);
    }

    static createFieldProperty(propertyType: ts.Type, object: ObjectReference, property: ts.Symbol) {
        return new ObjectFieldPropertyReference(propertyType, object, property);
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

    dereference(context: CodeGenerationContext) {
        return this.getValue(context);
    }

    castImplicit(type: ts.Type, context: CodeGenerationContext) {
        return this.dereference(context).castImplicit(type, context);
    }
}

/**
 * Backs a computed property, e.g. one that is implemented using get index() or one that resits in the runtime
 */
class ComputedObjectPropertyReference extends ObjectPropertyReference {
    constructor(propertyType: ts.Type, object: ObjectReference, private property: ts.Symbol, private getter: llvm.Function | undefined, private setter: llvm.Function | undefined) {
        super(propertyType, object);
    }

    protected getValue(context: CodeGenerationContext): Value {
        const result = context.builder.createCall(this.getter!, [this.object.generateIR(context)], this.property.name);
        return context.value(result, this.propertyType);
    }

    protected setValue(value: Value, context: CodeGenerationContext): void {
        const args = [
            value.generateIR(context),
            this.object.generateIR(context)
        ].reverse();

        context.builder.createCall(this.setter!, args);
    }

    isAssignable(): boolean {
        return !!this.setter;
    }
}

/**
 * Backs a property that dispatches directly to an object field
 */
class ObjectFieldPropertyReference extends ObjectPropertyReference {

    constructor(propertyType: ts.Type, object: ObjectReference, private property: ts.Symbol) {
        super(propertyType, object);
    }

    protected getValue(context: CodeGenerationContext): Value {
        const alignment = Allocation.getPreferredValueAlignment(this.propertyType, context);
        const value = context.builder.createAlignedLoad(this.getFieldAddress(context), alignment, this.property.name);
        return context.value(value, this.propertyType);
    }

    protected setValue(value: Value, context: CodeGenerationContext): void {
        const alignment = Allocation.getPreferredValueAlignment(this.propertyType, context);
        context.builder.createAlignedStore(value.generateIR(context), this.getFieldAddress(context), alignment);
    }

    isAssignable(): boolean {
        return true;
    }

    private getFieldAddress(context: CodeGenerationContext) {
        const fieldIndex = llvm.ConstantInt.get(context.llvmContext, this.object.clazz.getFieldOffset(this.property));
        return context.builder.createInBoundsGEP(this.object.generateIR(context), [ llvm.ConstantInt.get(context.llvmContext, 0), fieldIndex ], `&${this.property.name}`);
    }
}

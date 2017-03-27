import * as llvm from "llvm-node";
import {ObjectReference} from "./object-reference";

export interface Value {
    /**
     * Indicator if a value can be assigned to this.
     */
    isAssignable(): this is AssignableValue;

    /**
     * Indicator if this is an object reference
     */
    isObject(): this is ObjectReference;

    /**
     * Returns the dereferenced value in case this value is a storage location like allocation.
     * This might result in IR code being generated (e.g. Allocation.load)
     * Other values just return this.
     */
    dereference(): Value;

    /**
     * Generates the IR Code for this value
     */
    generateIR(): llvm.Value;
}

/**
 * Value that might be assigned to
 */
export interface AssignableValue extends Value {

    /**
     * Generates an assignment
     * @param value the value to assign
     * @throws if the value is not assignable {@link Value.isAssignable}
     */
    generateAssignmentIR(value: Value): void;
}

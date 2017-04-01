import * as llvm from "llvm-node";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * A value
 * Values should not have a reference to the code generation context as the code generation context is stateful. A reference
 * to the compilation context is allowed.
 */
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
    dereference(context: CodeGenerationContext): Value;

    /**
     * Generates the IR Code for this value
     */
    generateIR(context: CodeGenerationContext): llvm.Value;
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
    generateAssignmentIR(value: Value, context: CodeGenerationContext): void;
}

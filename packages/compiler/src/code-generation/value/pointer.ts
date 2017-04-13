import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "./address";

/**
 * A variable that stores an address.
 */
export interface Pointer extends Address {

    /**
     * Gets the address stored in this pointer
     */
    get(context: CodeGenerationContext): llvm.Value;

    /**
     * Stores the given address in this pointer
     * @param address the address to store in the pointer
     * @param context the code generation context
     */
    set(address: llvm.Value, context: CodeGenerationContext): void;

    isPointer(): true;
}

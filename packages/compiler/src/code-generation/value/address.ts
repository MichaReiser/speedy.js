import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {Pointer} from "./pointer";

/**
 * A value referencing a memory location
 */
export interface Address {
    /**
     * Returns the address
     * @param context the code generation context
     * @return the address
     */
    get(context: CodeGenerationContext): llvm.Value;

    /**
     * Indicator if this address is assignable
     */
    isPointer(): this is Pointer;
}

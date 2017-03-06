import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "./code-generation-context";

/**
 * Factory that creates the code generator emitter context
 */
export interface CodeGenerationContextFactory {

    /**
     * Creates a new llvm emit context
     * @param program the program
     * @param context the llvm context
     * @param module the llvm module
     * @return the emit context
     */
    createContext(program: ts.Program, context: llvm.LLVMContext, module: llvm.Module): CodeGenerationContext;
}

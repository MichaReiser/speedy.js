import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "./value";

/**
 * Reference to a --- probably overloaded --- function.
 */
export interface FunctionReference extends Value {
    /**
     * Invokes the function for the given call expression. The arguments are automatically coerced (if possible)
     * to expected parameter types
     * @param callExpression the call expression
     * @param callerContext the context of the function caller, e.g. used to generate the values for the arguments
     */
    invoke(callExpression: ts.CallExpression | ts.NewExpression, callerContext: CodeGenerationContext): Value | void;

    /**
     * Invokes the function with the given arguments. The values need to match the parameter type exactly
     * @param args the arguments to pass.
     * @param callerContext the context of the function caller
     */
    invokeWith(args: llvm.Value[], callerContext: CodeGenerationContext): Value | void;
}

/**
 * A function in LLVM is a pointer to a value of a function type. So, do not expect to always get an llvm.Function.
 */
export interface FunctionPointer extends llvm.Value {
    type: llvm.PointerType & { elementType: llvm.FunctionType };
}

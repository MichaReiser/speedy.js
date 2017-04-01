import * as ts from "typescript";
import {Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";

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
    invokeWith(args: Value[], callerContext: CodeGenerationContext): Value | void;
}

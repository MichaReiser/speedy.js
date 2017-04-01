import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Scope} from "./scope";
import {CompilationContext} from "../compilation-context";
import {Value} from "./value/value";
import {TypeChecker} from "../type-checker";

/**
 * The stateful code generation context for a specific llvm module
 */
export interface CodeGenerationContext {

    /**
     * The compilation context
     */
    readonly compilationContext: CompilationContext;

    /**
     * Reference to the type checker
     */
    readonly typeChecker: TypeChecker;

    /**
     * The llvm context
     */
    readonly llvmContext: llvm.LLVMContext;

    /**
     * The llvm module that is being generated
     */
    readonly module: llvm.Module;

    /**
     * The llvm ir builder for creating IR instructions
     */
    readonly builder: llvm.IRBuilder;

    /**
     * The current scope
     */
    readonly scope: Scope;

    /**
     * Creates a new child context with it's own builder and with a detached scope (but shared global scope)
     */
    createChildContext(): CodeGenerationContext;

    /**
     * Generates the llvm code for all children of the given node
     * @param node the node for which the children should be generated
     */
    generateChildren(node: ts.Node): void;

    /**
     * Generates the llvm IR code for the given code and returns the value for this node.
     * @param node the node for which the IR code is to be generated
     * @throws if the given node has no return value
     */
    generateValue(node: ts.Node): Value;

    /**
     * Generates the llvm IR code for the given node without returning the generated value.
     * @param node the node for which the IR code is to be generated
     * @returns the value generated if any or void if this node resulted in no generated IR value
     */
    generate(node: ts.Node): void | Value;

    /**
     * Assigns the given value to the target if the target is assignable
     * @param target the target to which the value is to be assigned
     * @param value the value to assign
     * @throws if the target cannot be assigned a value
     */
    assignValue(target: Value, value: Value): void;

    /**
     * Adds the name of an entry function
     * @param name the name of the entry function
     */
    addEntryFunction(name: string): void;

    /**
     * Returns the names of all entry functions
     */
    getEntryFunctionNames(): string[];

    /**
     * Enters a new child scope
     * @param fn the function to which this scope belongs
     */
    enterChildScope(fn?: llvm.Function): Scope;

    /**
     * Leaves the current child scope
     * @returns the left scope
     */
    leaveChildScope(): Scope;

    /**
     * Creates a value object for the given llvm value
     * @param value the llvm value to wrap
     * @param type the type of the value
     * @returns the value object wrapper
     */
    value(value: llvm.Value, type: ts.Type): Value;

    /**
     * Calls the given llvm function with the given arguments
     * @param fn the llvm function to call
     * @param args the arguments to pass to the function call
     * @param returnType the return type of the function
     * @param name the name of the return value
     * @returns the result of the function call or void if the called function is void (return type is void)
     */
    call(fn: llvm.Function, args: Value[] | llvm.Value[], returnType: ts.Type, name?: string): Value | void;
}

import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {TypeChecker} from "../type-checker";
import {Scope} from "./scope";
import {ClassReference} from "./value/class-reference";
import {Value} from "./value/value";

/**
 * The code generation context without extension methods
 * @see CodeGenerationContextMixin
 */
export interface BaseCodeGenerationContext {
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
     * Indicator if this compilation unit requires the inclusion of the garbage collector
     * @default false
     */
    requiresGc: boolean;

    /**
     * Creates a new child context with it's own builder and with a detached scope (but shared global scope)
     */
    createChildContext(): CodeGenerationContext;

    /**
     * Generates the llvm IR code for the given node without returning the generated value.
     * @param node the node for which the IR code is to be generated
     * @returns the value generated if any or void if this node resulted in no generated IR value
     */
    generate(node: ts.Node): void | Value;

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
}

/**
 * The stateful code generation context for a specific llvm module
 */
export interface CodeGenerationContext extends BaseCodeGenerationContext {

    /**
     * Assigns the given value to the target if the target is assignable
     * @param target the target to which the value is to be assigned
     * @param value the value to assign
     * @throws if the target cannot be assigned a value
     */
    assignValue(target: Value, value: Value): void;

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
     * Creates a value object for the given llvm value
     * @param value the llvm value to wrap
     * @param type the type of the value
     * @returns the value object wrapper
     */
    value(value: llvm.Value, type: ts.Type): Value;

    /**
     * Resolves the class belonging to the given type if supported or returns undefined if not
     * @param type the class type
     * @returns the reference to this class
     */
    resolveClass(type: ts.Type, symbol?: ts.Symbol): ClassReference | undefined;
}

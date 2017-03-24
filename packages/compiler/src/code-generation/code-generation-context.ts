import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Scope} from "./scope";
import {CompilationContext} from "../compilation-context";
import {Value} from "./value/value";
import {FunctionReference} from "./value/function-reference";
import {ObjectReference} from "./value/object-reference";
import {MethodReference} from "./value/method-reference";

/**
 * The stateful code generation context for a specific llvm module
 */
export interface CodeGenerationContext {

    readonly compilationContext: CompilationContext;

    /**
     * Reference to the type script program that is being compiled
     */
    readonly program: ts.Program;

    /**
     * Reference to the type checker
     */
    readonly typeChecker: ts.TypeChecker;

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
     * Adds the name of an entry function
     * @param name the name of the entry function
     */
    addEntryFunction(name: string);

    /**
     * Returns the names of all entry functions
     */
    getEntryFunctionNames(): string[];

    /**
     * Enters a new child scope
     * @param fn the function to which this scope belongs
     */
    enterChildScope(fn?: FunctionReference): Scope;

    leaveChildScope(): Scope;

    value(value: llvm.Value, type: ts.Type)

    functionReference(fn: llvm.Function, signature: ts.Signature): FunctionReference;

    methodReference(object: ObjectReference, method: llvm.Function, signature: ts.Signature): MethodReference;
}

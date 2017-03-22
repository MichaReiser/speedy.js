import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Scope} from "./scope";
import {CompilationContext} from "../compilation-context";

/**
 * The stateful code generation context
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
     * Generates an output for the given node that either does not result in a value (e.g. block statement)
     * or the caller is simply not interested in it. Method always succeeds
     * @param node the node for which the llvm output is to be generated
     */
    generateVoid(node: ts.Node): void;

    /**
     * Generates the llvm code for all children of the given node
     * @param node the node for which the children should be generated
     */
    generateChildren(node: ts.Node): void;

    /**
     * Generates the llvm IR code for the given code and returns the llvm value for this node.
     * This method fails if the given node does not return a value (e.g. if called for a block statement)
     * @param node the node for which the IR code is to be generated
     */
    generate(node: ts.Node): llvm.Value;

    /**
     * Adds the name of an entry function
     * @param name the name of the entry function
     */
    addEntryFunction(name: string);

    /**
     * Returns the names of all entry functions
     */
    getEntryFunctionNames(): string[];

    enterChildScope(): Scope;
    leaveChildScope(): Scope;

    resolve(symbol: ts.Symbol): llvm.Value;
}

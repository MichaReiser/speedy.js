import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Scope} from "./scope";
/**
 * The stateful code generation context
 */
export interface CodeGenerationContext {

    program: ts.Program;
    typeChecker: ts.TypeChecker;

    llvmContext: llvm.LLVMContext;
    module: llvm.Module;
    builder: llvm.IRBuilder;

    scope: Scope;

    generateVoid(node: ts.Node): void;
    generateChildren(node: ts.Node): void;
    generate(node: ts.Node): llvm.Value;

    /**
     * Adds the name of an entry function
     * @param name the name of the entry function
     */
    addEntryFunction(name: string);

    /**
     * Returns the names of all entry functions
     */
    getEntryFunctions(): string[];

    enterChildScope(): Scope;
    leaveChildScope(): Scope;
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "./code-generation-context";

/**
 * Code Generator for a specific TS Syntax Kind
 * Code Generators are stateless. State needs to be stored inside of the @link CodeGenerationContext
 */
export interface SyntaxCodeGenerator<T extends ts.Node> {

    /**
     * Returns the syntax kind of the nodes @link{T} handled by this code generator.
     * Used to speed up the lookup of the generator;
     */
    readonly syntaxKind: ts.SyntaxKind;

    /**
     * Generates the code for the givne node
     * @param node the node to emit
     */
    generate(node: T, context: CodeGenerationContext): void;
}

/**
 * An code generator for a node that returns a value. This is not the case for all code generatrs, e.g.
 * a block does not return a value.
 */
export interface ValueSyntaxCodeGenerator<T extends ts.Node> extends SyntaxCodeGenerator<T> {
    generateValue(node: T, context: CodeGenerationContext): llvm.Value;
}



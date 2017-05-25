import * as ts from "typescript";
import {CodeGenerationContext} from "./code-generation-context";
import {Value} from "./value/value";

/**
 * Code Generator for a specific TS Syntax Kind
 * Code Generators are stateless. State needs to be stored inside of the @link CodeGenerationContext
 */
export interface SyntaxCodeGenerator<T extends ts.Node, R extends Value | void> {

    /**
     * Returns the syntax kind of the nodes @link{T} handled by this code generator.
     * Used to speed up the lookup of the generator;
     */
    readonly syntaxKind: ts.SyntaxKind;

    /**
     * Generates the code for the given node
     * @param node the node to emit
     * @returns either the value that is the result of this node or void
     */
    generate(node: T, context: CodeGenerationContext): R;
}

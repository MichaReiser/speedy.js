import * as ts from "typescript";
import {CodeGenerationContext} from "./code-generation-context";
import {Value} from "./value/value";

/**
 * Emitter used for all syntax kinds not handled by a specific emitter
 */
export interface FallbackCodeGenerator {
    generate(node: ts.Node, context: CodeGenerationContext): void | Value;
}

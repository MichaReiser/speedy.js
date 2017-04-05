import * as ts from "typescript";

import {CodeGenerationContext} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {CodeGenerationError} from "../code-generation-error";

/**
 * Code Generator implementation that logs a message to the console.
 * Useful for cases where the syntax is not yet implemented.
 */
export class NotYetImplementedCodeGenerator implements FallbackCodeGenerator {

    generate(node: ts.Node, context: CodeGenerationContext): void {
        throw CodeGenerationError.unsupportedSyntaxKind(node);
    }
}

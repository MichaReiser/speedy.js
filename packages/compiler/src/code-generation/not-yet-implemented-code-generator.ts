import * as ts from "typescript";
import * as debug from "debug";

import {CodeGenerationContext} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";

const log = debug("code-generation/not-yet-implemented-generator");

/**
 * Code Generator implementation that logs a message to the console.
 * Useful for cases where the syntax is not yet implemented.
 */
export class NotYetImplementedCodeGenerator implements FallbackCodeGenerator {

    generate(node: ts.Node, context: CodeGenerationContext): void {
        log(`CodeGenerator for node ${ts.SyntaxKind[node.kind]} not yet implemented`);
    }
}

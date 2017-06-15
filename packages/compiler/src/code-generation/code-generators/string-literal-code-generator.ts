import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code generators for string literals "hello world"
 */
class StringLiteralCodeGenerator implements SyntaxCodeGenerator<ts.StringLiteral, void> {
    syntaxKind = ts.SyntaxKind.StringLiteral;

    generate(node: ts.StringLiteral, context: CodeGenerationContext): void {
        // e.g. "use speedyjs";
        if (StringLiteralCodeGenerator.isPrologueDirective(node)) {
            return;
        }

        throw CodeGenerationDiagnostics.unsupportedSyntaxKind(node);
    }

    /**
     * Test if this string literal is a prologue (e.g. "use strict")
     * @param node the string literal to test for
     * @return {boolean} true if it is a prologue, false otherwise
     */
    static isPrologueDirective(node: ts.StringLiteral): boolean {
        return !!node.parent && node.parent.kind === ts.SyntaxKind.ExpressionStatement;
    }
}

export default StringLiteralCodeGenerator;

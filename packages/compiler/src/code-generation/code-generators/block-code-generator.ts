import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

/**
 * Code Generator for a block ({}) statement
 */
class BlockCodeGenerator implements SyntaxCodeGenerator<ts.Block, void> {

    syntaxKind = ts.SyntaxKind.Block;

    generate(node: ts.Block, context: CodeGenerationContext): void {
        context.enterChildScope();
        context.generateChildren(node);
        context.leaveChildScope();
    }
}

export default BlockCodeGenerator;

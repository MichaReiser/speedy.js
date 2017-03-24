import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

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

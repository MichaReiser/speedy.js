import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGeneratorHelper} from "../util/array-code-generator-helper";

/**
 * Code Generator for a block ({}) statement
 */
class BlockCodeGenerator implements SyntaxCodeGenerator<ts.Block> {

    syntaxKind = ts.SyntaxKind.Block;

    generate(node: ts.Block, context: CodeGenerationContext): void {
        context.enterChildScope();

        ts.forEachChild(node, child => context.generateVoid(child));

        context.leaveChildScope();
    }
}

export default BlockCodeGenerator;

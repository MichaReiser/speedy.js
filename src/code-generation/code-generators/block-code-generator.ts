import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class BlockCodeGenerator implements SyntaxCodeGenerator<ts.Block> {

    syntaxKind = ts.SyntaxKind.Block;

    generate(node: ts.Block, context: CodeGenerationContext): void {
        context.enterChildScope();

        ts.forEachChild(node, child => context.generateVoid(child));
    }
}

export default BlockCodeGenerator;

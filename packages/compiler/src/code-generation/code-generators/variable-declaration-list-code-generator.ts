import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class VariableDeclarationListCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclarationList, void> {
    syntaxKind = ts.SyntaxKind.VariableDeclarationList;

    generate(variableDeclarationList: ts.VariableDeclarationList, context: CodeGenerationContext): void {
        if ((variableDeclarationList.flags & ts.NodeFlags.Let) !== ts.NodeFlags.Let && (variableDeclarationList.flags & ts.NodeFlags.Const) !== ts.NodeFlags.Const) {
            throw new Error(`Only const and let variables are supported`);
        }

        context.generateChildren(variableDeclarationList);
    }
}

export default VariableDeclarationListCodeGenerator;

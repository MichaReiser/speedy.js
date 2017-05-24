import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

class VariableDeclarationListCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclarationList, void> {
    syntaxKind = ts.SyntaxKind.VariableDeclarationList;

    generate(variableDeclarationList: ts.VariableDeclarationList, context: CodeGenerationContext): void {
        if ((variableDeclarationList.flags & ts.NodeFlags.Let) !== ts.NodeFlags.Let && (variableDeclarationList.flags & ts.NodeFlags.Const) !== ts.NodeFlags.Const) {
            throw CodeGenerationDiagnostic.variableDeclarationList(variableDeclarationList);
        }

        context.generateChildren(variableDeclarationList);
    }
}

export default VariableDeclarationListCodeGenerator;

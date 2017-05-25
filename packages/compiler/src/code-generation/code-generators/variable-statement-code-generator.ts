import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class VariableStatementCodeGenerator implements SyntaxCodeGenerator<ts.VariableStatement, void> {
    syntaxKind = ts.SyntaxKind.VariableStatement;

    generate(node: ts.VariableStatement, context: CodeGenerationContext): void {
        context.generate(node.declarationList);
    }

}

export default VariableStatementCodeGenerator;

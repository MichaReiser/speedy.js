import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class VariableStatementCodeGenerator implements SyntaxCodeGenerator<ts.VariableStatement> {
    syntaxKind = ts.SyntaxKind.VariableStatement;

    generate(node: ts.VariableStatement, context: CodeGenerationContext): void {
        context.generateVoid(node.declarationList);
    }
}

export default VariableStatementCodeGenerator;

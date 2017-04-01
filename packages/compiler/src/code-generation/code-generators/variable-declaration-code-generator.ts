import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";

class VariableDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclaration, void> {
    syntaxKind = ts.SyntaxKind.VariableDeclaration;

    generate(variableDeclaration: ts.VariableDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(variableDeclaration.name);
        const type = context.typeChecker.getTypeAtLocation(variableDeclaration);

        const allocation = Allocation.createInEntryBlock(type, context, (variableDeclaration.name as ts.Identifier).text);
        let initializer: llvm.Value | undefined;

        if (variableDeclaration.initializer) {
            initializer = context.generateValue(variableDeclaration.initializer).generateIR(context);
        }
        // otherwise no initialization is needed. Typescript complains if variable is accessed before assignment

        if (initializer) {
            allocation.generateAssignmentIR(initializer, context);
        }

        context.scope.addVariable(symbol, allocation);
    }
}

export default VariableDeclarationCodeGenerator;

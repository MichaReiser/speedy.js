import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

class VariableDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclaration, void> {
    syntaxKind = ts.SyntaxKind.VariableDeclaration;

    generate(variableDeclaration: ts.VariableDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(variableDeclaration.name);
        const type = context.typeChecker.getTypeAtLocation(variableDeclaration);

        const allocation = Allocation.create(type, context, symbol.name);

        if (variableDeclaration.initializer) {
            let initializerType = context.typeChecker.getTypeAtLocation(variableDeclaration.initializer);
            const initializer = context.generateValue(variableDeclaration.initializer);
            const castedInitializer = initializer.castImplicit(type, context);

            if (!castedInitializer) {
                throw CodeGenerationDiagnostic.unsupportedImplicitCast(variableDeclaration, context.typeChecker.typeToString(type), context.typeChecker.typeToString(initializerType));
            }

            allocation.generateAssignmentIR(castedInitializer, context);
        }

        // otherwise no initialization is needed. Typescript complains if a variable is accessed before it has been assigned a value
        // Furthermore, the WebAssembly standard guarantees that local variables are default initialized.

        context.scope.addVariable(symbol, allocation);
    }
}

export default VariableDeclarationCodeGenerator;

import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {Allocation} from "../value/allocation";

class VariableDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclaration, void> {
    syntaxKind = ts.SyntaxKind.VariableDeclaration;

    generate(variableDeclaration: ts.VariableDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(variableDeclaration.name);
        const type = context.typeChecker.getTypeAtLocation(variableDeclaration);
        const llvmType = toLLVMType(type, context);

        const allocation = Allocation.createInEntryBlock(type, context, (variableDeclaration.name as ts.Identifier).text);
        let initializer: llvm.Value | undefined;

        if (variableDeclaration.initializer) {
            initializer = context.generateValue(variableDeclaration.initializer).generateIR();
        } else if (!context.compilationContext.compilerOptions.unsafe) {
            initializer = llvm.Constant.getNullValue(llvmType);
        }

        if (initializer) {
            allocation.generateAssignmentIR(initializer);
        }

        context.scope.addVariable(symbol, allocation);
    }
}

export default VariableDeclarationCodeGenerator;

import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {createAllocationInEntryBlock} from "../util/allocations";

class VariableDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclaration> {
    syntaxKind = ts.SyntaxKind.VariableDeclaration;

    generate(variableDeclaration: ts.VariableDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(variableDeclaration.name);
        const type = context.typeChecker.getTypeAtLocation(variableDeclaration);
        const llvmType = toLLVMType(type, context.llvmContext);

        const allocation = createAllocationInEntryBlock(context.builder.getInsertBlock().parent!, llvmType, symbol.name); // TODO test if function is set

        if (variableDeclaration.initializer) {
            context.builder.createStore(context.generate(variableDeclaration.initializer), allocation);
        }

        context.scope.addVariable(symbol, allocation);
    }
}

export default VariableDeclarationCodeGenerator;

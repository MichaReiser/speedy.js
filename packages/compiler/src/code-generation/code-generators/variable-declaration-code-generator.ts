import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {createAllocationInEntryBlock} from "../util/allocations";

class VariableDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.VariableDeclaration> {
    syntaxKind = ts.SyntaxKind.VariableDeclaration;

    generate(variableDeclaration: ts.VariableDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(variableDeclaration.name);
        const type = context.typeChecker.getTypeAtLocation(variableDeclaration);
        const llvmType = toLLVMType(type, context);

        const allocation = createAllocationInEntryBlock(context.builder.getInsertBlock().parent!, llvmType, symbol.name); // TODO test if function is set
        let initializer: llvm.Value | undefined;

        if (variableDeclaration.initializer) {
            initializer = context.generate(variableDeclaration.initializer);
        } else if (!context.compilationContext.compilerOptions.unsafe) {
            initializer = llvm.Constant.getNullValue(llvmType);
        }

        if (initializer) {
            context.builder.createAlignedStore(initializer, allocation, context.module.dataLayout.getPrefTypeAlignment(llvmType));
        }

        context.scope.addVariable(symbol, allocation);
    }
}

export default VariableDeclarationCodeGenerator;

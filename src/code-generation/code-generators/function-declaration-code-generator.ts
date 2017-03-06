import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";

class FunctionDeclarationCodeGenerator implements ValueSyntaxCodeGenerator<ts.FunctionDeclaration> {
    syntaxKind = ts.SyntaxKind.FunctionDeclaration;

    generate(node: ts.FunctionDeclaration, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    generateValue(functionDeclaration: ts.FunctionDeclaration, context: CodeGenerationContext): llvm.Value {
        if (!functionDeclaration.body) {
            throw new Error(`Cannot transform function declaration without body`)
        }

        if (!functionDeclaration.name) {
            throw new Error(`Cannot transform function declaration without name`);
        }

        const signature = context.typeChecker.getSignatureFromDeclaration(functionDeclaration);
        const returnType = context.typeChecker.getReturnTypeOfSignature(signature);
        const symbol = context.typeChecker.getSymbolAtLocation(functionDeclaration.name);

        const llvmReturnType = toLLVMType(returnType, context.llvmContext);
        const parameters: llvm.Type[] = [];

        for (const parameter of functionDeclaration.parameters) {
            const parameterType = context.typeChecker.getTypeAtLocation(parameter);
            parameters.push(toLLVMType(parameterType, context.llvmContext));
        }

        const functionType = llvm.FunctionType.get(llvmReturnType, parameters, false);
        const fun = llvm.Function.create(functionType, llvm.LinkageTypes.ExternalLinkage, symbol.name, context.module);

        context.scope.addFunction(symbol, fun);

        context.enterChildScope();

        const entryBlock = llvm.BasicBlock.create(context.llvmContext, "entry", fun);

        context.builder.setInsertionPoint(entryBlock);

        // add args to scope
        const args = fun.getArguments();
        for (let i = 0; i < signature.parameters.length; ++i) {
            const type = toLLVMType(context.typeChecker.getTypeAtLocation(functionDeclaration.parameters[i]), context.llvmContext);
            const allocation = context.builder.createAlloca(type, undefined, signature.parameters[i].name);
            context.builder.createStore(args[i], allocation);
            context.scope.addVariable(signature.parameters[i], allocation);
            args[i].name = signature.parameters[i].name;
        }

        const returnBlock = llvm.BasicBlock.create(context.llvmContext, "returnBlock");
        context.scope.returnBlock = returnBlock;

        if (returnType.flags === ts.TypeFlags.Void) {
            context.builder.createRetVoid();
        } else {
            context.scope.returnAllocation = context.builder.createAlloca(llvmReturnType, undefined, "returnValue");
        }

        context.generateVoid(functionDeclaration.body);

        // Current Block is empty, so we can use the current block instead of the return block
        if (context.builder.getInsertBlock().empty) {
            returnBlock.replaceAllUsesWith(context.builder.getInsertBlock());
            returnBlock.release();
        } else if (returnBlock.useEmpty()) { // No return statement
            returnBlock.release();
        } else { // at least one return statement
            fun.addBasicBlock(returnBlock);
            context.builder.setInsertionPoint(returnBlock);
        }

        // Add Return Statement
        if (context.scope.returnAllocation) {
            context.builder.createRet(context.builder.createLoad(context.scope.returnAllocation, "return"));
        }

        context.leaveChildScope();

        fun.dump();
        llvm.verifyFunction(fun);

        return fun;
    }

}

export default FunctionDeclarationCodeGenerator;

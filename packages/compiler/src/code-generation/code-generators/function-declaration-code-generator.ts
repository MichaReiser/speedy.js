import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";
import {FunctionReference} from "../value/function-reference";
import {Allocation} from "../value/allocation";
import {ObjectReference} from "../value/object-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class FunctionDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.FunctionDeclaration, FunctionReference> {
    syntaxKind = ts.SyntaxKind.FunctionDeclaration;

    generate(functionDeclaration: ts.FunctionDeclaration, context: CodeGenerationContext): FunctionReference {
        if (!functionDeclaration.body) {
            throw new Error(`Cannot transform function declaration without body`)
        }

        if (!functionDeclaration.name) {
            throw new Error(`Cannot transform function declaration without name`);
        }

        const signature = context.typeChecker.getSignatureFromDeclaration(functionDeclaration);
        const returnType = context.typeChecker.getReturnTypeOfSignature(signature);
        const symbol = context.typeChecker.getSymbolAtLocation(functionDeclaration.name);

        const llvmReturnType = toLLVMType(returnType, context);
        const parameters: llvm.Type[] = [];

        for (const parameter of functionDeclaration.parameters) {
            const parameterType = context.typeChecker.getTypeAtLocation(parameter);
            parameters.push(toLLVMType(parameterType, context));
        }

        const functionType = llvm.FunctionType.get(llvmReturnType, parameters, false);
        const fun = llvm.Function.create(functionType, llvm.LinkageTypes.ExternalLinkage, symbol.name, context.module);
        const functionReference = context.functionReference(fun, signature);

        context.scope.addFunction(symbol, functionReference);
        context.enterChildScope(functionReference);

        const entryBlock = llvm.BasicBlock.create(context.llvmContext, "entry", fun);
        context.builder.setInsertionPoint(entryBlock);

        // add args to scope
        const args = fun.getArguments();
        for (let i = 0; i < signature.parameters.length; ++i) {
            const parameter = functionDeclaration.parameters[i];
            const argumentIdentifier = parameter.name as ts.Identifier;
            const type = context.typeChecker.getTypeAtLocation(parameter);
            const allocation = Allocation.create(type, context, argumentIdentifier.text);

            allocation.generateAssignmentIR(args[i]);
            context.scope.addVariable(signature.parameters[i], allocation);
            args[i].name = signature.parameters[i].name;
        }

        const returnBlock = llvm.BasicBlock.create(context.llvmContext, "returnBlock");
        context.scope.returnBlock = returnBlock;

        if (returnType.flags !== ts.TypeFlags.Void) {
            context.scope.returnAllocation = Allocation.create(returnType, context, "return");
        }

        context.generate(functionDeclaration.body);

        // Current Block is empty, so we can use the current block instead of the return block
        const predecessor = context.builder.getInsertBlock();
        if (predecessor.empty) {
            returnBlock.replaceAllUsesWith(predecessor);
            returnBlock.release();
        } else if (returnBlock.useEmpty()) { // No return statement
            returnBlock.release();
        } else { // at least one return statement
            if (!predecessor.getTerminator()) {
                context.builder.createBr(returnBlock); // Fall through to return block
            }
            fun.addBasicBlock(returnBlock);
            context.builder.setInsertionPoint(returnBlock);
        }

        // Cleanup Heap
        this.cleanUpHeap(context);

        // Add Return Statement
        if (context.scope.returnAllocation) {
            context.builder.createRet(context.scope.returnAllocation.generateIR());
        } else {
            context.builder.createRetVoid();
        }

        context.leaveChildScope();

        try {
            llvm.verifyFunction(fun);
        } catch (ex) {
            fun.dump();
            throw ex;
        }

        return functionReference;
    }

    private cleanUpHeap(context: CodeGenerationContext) {
        for (const variable of context.scope.getAllVariables()) {
            const variableAllocation = context.scope.getNested(variable);
            // TODO Property members cannnot be identified this way
            if (variableAllocation!.type.flags & ts.TypeFlags.Object) {
                const object = variableAllocation!.dereference() as ObjectReference;
                object.destruct();
            }
        }
    }

}

export default FunctionDeclarationCodeGenerator;

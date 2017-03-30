import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {Allocation} from "../value/allocation";
import {FunctionReference} from "../value/function-reference";
import {ObjectReference} from "../value/object-reference";
import {toLLVMType} from "./type-mapping";

/**
 * Builder for declaring llvm functions
 */
export class FunctionBuilder {
    private linkageType = llvm.LinkageTypes.InternalLinkage;
    private functionReference?: FunctionReference;

    private constructor(private symbol: ts.Symbol, private declaration: ts.SignatureDeclaration, private returnType: ts.Type, private context: CodeGenerationContext) {
    }

    /**
     * Creates a builder for the given signature
     * @param signature the signature of the function
     * @param context the code generation context
     * @return {FunctionBuilder} the created builder instance to declare a function with the given signature
     */
    static forSignature(signature: ts.Signature, context: CodeGenerationContext) {
        return this.create(signature.declaration, signature.getReturnType(), context);
    }

    /**
     * Creates a builder for declaring a function with the given parameters and return type
     * @param declaration the declaration with the function parameters (and name)
     * @param returnType the return type of the function
     * @param context the code generation context
     * @return {FunctionBuilder} the builder instance
     */
    static create(declaration: ts.SignatureDeclaration, returnType: ts.Type, context: CodeGenerationContext) {
        if (!declaration.name) {
            throw new Error(`Cannot transform function declaration without name`);
        }

        const symbol = context.typeChecker.getSymbolAtLocation(declaration.name!);
        return new FunctionBuilder(symbol, declaration, returnType, context);
    }

    private get llvmFunction() {
        assert(this.functionReference, "The header needs to be generated first before the body can be generated");
        return this.functionReference!.getLLVMFunction();
    }

    /**
     * Sets the function as externally linked
     * @return this for a fluent api
     */
    externalLinkage(): this {
        return this.linkage(llvm.LinkageTypes.ExternalLinkage);
    }

    /**
     * Sets the function as internally linked
     * @return this for a fluent api
     */
    internalLinkage(): this {
        return this.linkage(llvm.LinkageTypes.InternalLinkage);
    }

    /**
     * Changes the linkage of the function to the value passed
     * @param linkage the desired linkage
     * @return this for a fluent api
     */
    linkage(linkage: llvm.LinkageTypes): this {
        this.linkageType= linkage;
        return this;
    }

    /**
     * Builds / Generates the llvm.Function for the given function declaration
     * @param declaration the function declaration
     * @return {FunctionReference} the reference for the generated function
     */
    generate(declaration: ts.FunctionLikeDeclaration): FunctionReference {
        assert(declaration.body, `Cannot transform function declaration without a body`);
        this.generateHeader()
            .generateBody(declaration.body!);

        return this.functionReference!;
    }

    /**
     * Generates only the header of the function and registers the function in the scope (important to be able to handle recursive functions)
     * @return this for a fluent api
     */
    generateHeader(): this {
        const llvmReturnType = toLLVMType(this.returnType, this.context);
        const parameters: llvm.Type[] = [];

        for (const parameter of this.declaration.parameters) {
            const parameterType = this.context.typeChecker.getTypeAtLocation(parameter);
            parameters.push(toLLVMType(parameterType, this.context));
        }

        const functionType = llvm.FunctionType.get(llvmReturnType, parameters, false);

        const fun = llvm.Function.create(functionType, this.linkageType, this.symbol.name, this.context.module);
        this.functionReference = this.context.functionReference(fun, this.returnType);

        this.context.scope.addFunction(this.symbol, this.functionReference);

        return this;
    }

    /**
     * Generates the body of the function
     * @param body the body of the function
     * @return this for a fluent api
     */
    generateBody(body: ts.Block | ts.Expression): this {
        assert(this.functionReference, "Generate the header before generate the body of the function");
        this.context.enterChildScope(this.functionReference);

        const entryBlock = llvm.BasicBlock.create(this.context.llvmContext, "entry", this.llvmFunction);
        const returnBlock = llvm.BasicBlock.create(this.context.llvmContext, "returnBlock");
        this.context.builder.setInsertionPoint(entryBlock);
        this.context.scope.returnBlock = returnBlock;

        if (this.returnType.flags !== ts.TypeFlags.Void) {
            this.context.scope.returnAllocation = Allocation.create(this.returnType, this.context, "return");
        }

        this.allocateArguments();
        this.context.generate(body);

        this.setBuilderToReturnBlock(returnBlock);

        // Cleanup Heap
        this.cleanUpHeap();

        // Add Return Statement
        this.generateReturnStatement();

        this.context.leaveChildScope();

        llvm.verifyFunction(this.llvmFunction);

        return this;
    }

    private cleanUpHeap() {
        for (const variable of this.context.scope.getAllVariables()) {
            const variableAllocation = this.context.scope.getNested(variable);
            // TODO Property members, anonymous arrays are not identified by this approach, aliased members are released multiple times
            if (variableAllocation!.type.flags & ts.TypeFlags.Object) {
                const object = variableAllocation!.dereference() as ObjectReference;
                object.destruct();
            }
        }
    }

    private generateReturnStatement() {
        if (this.context.scope.returnAllocation) {
            this.context.builder.createRet(this.context.scope.returnAllocation.generateIR());
        } else {
            this.context.builder.createRetVoid();
        }
    }

    private setBuilderToReturnBlock(returnBlock: llvm.BasicBlock) {
        // Current Block is empty, so we can use the current block instead of the return block
        const predecessor = this.context.builder.getInsertBlock();
        if (predecessor.empty) {
            returnBlock.replaceAllUsesWith(predecessor);
            returnBlock.release();
        } else if (returnBlock.useEmpty()) { // No return statement
            returnBlock.release();
        } else { // at least one return statement
            if (!predecessor.getTerminator()) {
                this.context.builder.createBr(returnBlock); // Fall through to return block
            }
            this.llvmFunction.addBasicBlock(returnBlock);
            this.context.builder.setInsertionPoint(returnBlock);
        }
    }

    private allocateArguments() {
        const args = this.llvmFunction.getArguments();
        for (let i = 0; i < this.declaration.parameters.length; ++i) {
            const parameter = this.declaration.parameters[i];
            const parameterSymbol = this.context.typeChecker.getSymbolAtLocation(parameter.name);
            const argumentIdentifier = parameter.name as ts.Identifier;
            const type = this.context.typeChecker.getTypeAtLocation(parameter);
            const allocation = Allocation.create(type, this.context, argumentIdentifier.text);

            allocation.generateAssignmentIR(args[i]);
            this.context.scope.addVariable(parameterSymbol, allocation);
            args[i].name = parameterSymbol.name;
        }
    }
}

import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReference} from "../value/function-reference";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "../value/resolved-function";
import {ResolvedFunctionReference} from "../value/resolved-function-reference";
import {FunctionDeclarationBuilder} from "./function-declaration-builder";
import {FunctionDefinitionBuilder} from "./function-definition-builder";

/**
 * Builder for declaring and defining llvm functions
 */
export class FunctionBuilder {
    private declarationBuilder: FunctionDeclarationBuilder;
    private constructor(private resolvedFunction: ResolvedFunction, private context: CodeGenerationContext) {
        this.declarationBuilder = FunctionDeclarationBuilder.forResolvedFunction(resolvedFunction, context);
    }

    /**
     * Creates a builder for the given signature
     * @param signature the signature of the function
     * @param context the code generation context
     * @return {FunctionDeclarationBuilder} the created builder instance to declare a function with the given signature
     */
    static forSignature(signature: ts.Signature, context: CodeGenerationContext) {
        return this.create(signature, context);
    }

    /**
     * Creates a builder for declaring a function with the given parameters and return type
     * @param signature the declaration with the function parameters (and name)
     * @param context the code generation context
     * @return {FunctionDeclarationBuilder} the builder instance
     */
    static create(signature: ts.Signature, context: CodeGenerationContext) {
        if (!signature.declaration.name) {
            throw new Error(`Cannot transform function declaration without name`);
        }

        return new FunctionBuilder(createResolvedFunctionFromSignature(signature, context.compilationContext), context);
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
        this.declarationBuilder.linkage(linkage);
        return this;
    }

    /**
     * Builds / Generates the llvm.Function for the given function declaration
     * @param declaration the function declaration
     * @return {FunctionReference} the reference for the generated function
     */
    define(declaration: ts.FunctionLikeDeclaration): FunctionReference {
        assert(declaration.body, `Cannot transform function declaration without a body`);
        const fun = this.declarationBuilder.declare();
        const functionReference = ResolvedFunctionReference.create(fun, this.resolvedFunction);

        if (this.resolvedFunction.symbol) {
            this.context.scope.addFunction(this.resolvedFunction.symbol, functionReference);
        }

        FunctionDefinitionBuilder.create(fun, this.resolvedFunction, this.context)
            .define(declaration);

        return functionReference;
    }
}

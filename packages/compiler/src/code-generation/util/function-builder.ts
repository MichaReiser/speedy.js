import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReference} from "../value/function-reference";
import {ResolvedFunction} from "../value/resolved-function";
import {ResolvedFunctionReference} from "../value/resolved-function-reference";
import {FunctionDeclarationBuilder} from "./function-declaration-builder";
import {FunctionDefinitionBuilder} from "./function-definition-builder";

/**
 * Builder for declaring and defining llvm functions
 */
export class FunctionBuilder {
    private declarationBuilder: FunctionDeclarationBuilder;
    private _name: string;
    private constructor(private resolvedFunction: ResolvedFunction, private context: CodeGenerationContext) {
        this.declarationBuilder = FunctionDeclarationBuilder.forResolvedFunction(resolvedFunction, context);
        this._name = resolvedFunction.functionName;
    }

    /**
     * Creates a builder for declaring the given resolved function
     * @param resolvedFunction the resolved function to declare
     * @param context the code generation context
     * @return {FunctionDeclarationBuilder} the builder instance
     */
    static create(resolvedFunction: ResolvedFunction, context: CodeGenerationContext) {
        return new FunctionBuilder(resolvedFunction, context);
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
     * Changes the name of the function
     * @param name the name of the function
     * @return {FunctionBuilder} this for a fluent api
     */
    name(name: string) {
        this._name = name;
        return this;
    }

    /**
     * Builds / Generates the llvm.Function for the given function declaration
     * @param declaration the function declaration
     * @return {FunctionReference} the reference for the generated function
     */
    define(declaration: ts.FunctionLikeDeclaration): FunctionReference {
        assert(declaration.body, `Cannot transform function declaration without a body`);

        const fun = this.declarationBuilder.name(this._name).declare();
        const functionReference = ResolvedFunctionReference.create(fun, this.resolvedFunction);

        if (this.resolvedFunction.symbol) {
            this.context.scope.addFunction(this.resolvedFunction.symbol, functionReference);
        }

        FunctionDefinitionBuilder.create(fun, this.resolvedFunction, this.context)
            .define(declaration);

        return functionReference;
    }
}

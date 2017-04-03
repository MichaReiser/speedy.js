import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "./types";
import {ResolvedFunction} from "../value/resolved-function";

/**
 * Builder for declaring llvm functions
 */
export class FunctionDeclarationBuilder {
    private linkageType = llvm.LinkageTypes.InternalLinkage;
    private constructor(private _name: string, private parameters: { name: string, type: ts.Type}[], private returnType: ts.Type, private context: CodeGenerationContext) {
    }

    /**
     * Creates a builder for the given resolved function
     * @param resolvedFunction the resolvedFunction
     * @param context the code generation context
     * @param returnType in case the return type differs from the one specified on the resolved function
     * @return {FunctionDeclarationBuilder} the created builder instance to declare a function with the given signature
     */
    static forResolvedFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, returnType?: ts.Type): FunctionDeclarationBuilder {
        return this.create(resolvedFunction.functionName, resolvedFunction.parameters, returnType || resolvedFunction.returnType, context);
    }

    /**
     * Creates a builder to declare a function
     * @param name the name of the function
     * @param parameters the parameters of the function and their type
     * @param returnType the return type of the function
     * @param context the context
     * @return the builder
     */
    static create(name: string, parameters: { name: string, type: ts.Type}[], returnType: ts.Type, context: CodeGenerationContext): FunctionDeclarationBuilder {
        return new FunctionDeclarationBuilder(name, parameters, returnType, context);
    }

    /**
     * Changes the name of the function
     * @param name the new name
     * @return this for a fluent api
     */
    name(name: string) {
        this._name = name;
        return this;
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
     * Generates only the header of the function and registers the function in the scope (important to be able to handle recursive functions)
     * @return this for a fluent api
     */
    declare(): llvm.Function {
        const llvmReturnType = toLLVMType(this.returnType, this.context);
        const parameters: llvm.Type[] = [];

        for (const parameter of this.parameters) {
            parameters.push(toLLVMType(parameter.type, this.context));
        }

        const functionType = llvm.FunctionType.get(llvmReturnType, parameters, false);

        return llvm.Function.create(functionType, this.linkageType, this._name, this.context.module);
    }

    declareIfNotExisting(): llvm.Function {
        const existing = this.context.module.getFunction(this._name);
        if (existing) {
            return existing;
        }

        return this.declare();
    }
}

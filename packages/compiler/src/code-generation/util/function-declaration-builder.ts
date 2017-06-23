import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {ResolvedFunction} from "../value/resolved-function";
import {toLLVMType} from "./types";
import * as assert from "assert";

/**
 * Builder for declaring llvm functions
 */
export class FunctionDeclarationBuilder {
    private linkageType = llvm.LinkageTypes.InternalLinkage;
    private attributes: llvm.Attribute.AttrKind[] = [];

    private constructor(private functionName: string | undefined,
                        private parameters: Array<{ name: string, type: ts.Type}>,
                        private returnType: ts.Type,
                        private context: CodeGenerationContext) {
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
    static create(name: string | undefined,
                  parameters: Array<{ name: string, type: ts.Type}>,
                  returnType: ts.Type, context: CodeGenerationContext): FunctionDeclarationBuilder {
        return new FunctionDeclarationBuilder(name, parameters, returnType, context);
    }

    /**
     * Changes the name of the function
     * @param name the new name
     * @return this for a fluent api
     */
    name(name: string) {
        this.functionName = name;
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
     * Sets the function as link once ODR linked
     * @return this for a fluent api
     */
    linkOnceOdrLinkage(): this {
        return this.linkage(llvm.LinkageTypes.LinkOnceODRLinkage);
    }

    /**
     * Adds the given function attribute
     * @param attribute the attribute to add
     * @return {FunctionDeclarationBuilder}
     */
    withAttribute(attribute: llvm.Attribute.AttrKind) {
        this.attributes.push(attribute);
        return this;
    }

    /**
     * Changes the linkage of the function to the value passed
     * @param linkage the desired linkage
     * @return this for a fluent api
     */
    linkage(linkage: llvm.LinkageTypes): this {
        this.linkageType = linkage;
        return this;
    }

    /**
     * Generates only the header of the function and registers the function in the scope (important to be able to handle recursive functions)
     * @return this for a fluent api
     */
    declare(): llvm.Function {
        assert(this.functionName, "Cannot declare a function without a name");
        const llvmReturnType = toLLVMType(this.returnType, this.context);
        const parameters: llvm.Type[] = [];

        for (const parameter of this.parameters) {
            parameters.push(toLLVMType(parameter.type, this.context));
        }

        const functionType = llvm.FunctionType.get(llvmReturnType, parameters, false);

        const fn = llvm.Function.create(functionType, this.linkageType, this.functionName, this.context.module);

        for (const attribute of this.attributes) {
            fn.addFnAttr(attribute);
        }

        return fn;
    }

    declareIfNotExisting(): llvm.Function {
        const existing = this.context.module.getFunction(this.functionName!);
        if (existing) {
            return existing;
        }

        return this.declare();
    }
}

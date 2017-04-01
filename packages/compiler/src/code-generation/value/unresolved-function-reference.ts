import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {AbstractFunctionReference} from "./abstract-function-reference";
import {FunctionFactory} from "./function-factory";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {SpeedyJSFunctionFactory} from "./speedyjs-function-factory";
import {Value} from "./value";

/**
 * Reference to a probably overloaded function.
 * Implements the logic to resolve the specific overload for a call expression.
 */
export class UnresolvedFunctionReference extends AbstractFunctionReference {
    /**
     * Creates a reference to a function reference that has the specified overloads
     * @param signatures the references of the function
     * @param context the context
     * @param classType the class type if the function is an instance or static method of an object
     * @return {UnresolvedFunctionReference} the function reference
     */
    static createRuntimeFunction(signatures: ts.Signature[], context: CodeGenerationContext, classType?: ts.ObjectType) {
        const functionReference = new UnresolvedFunctionReference(signatures, new FunctionFactory(new RuntimeSystemNameMangler(context.compilationContext)), classType);
        functionReference.linkage = llvm.LinkageTypes.ExternalLinkage;
        return functionReference;
    }

    /**
     * Creates a reference to a function that has the specified overloads
     * @param signatures the signatures of the function
     * @param context the context
     * @param classType the class type if the function is an instance or static method of an object
     * @return {UnresolvedFunctionReference} the function reference
     */
    static createFunction(signatures: ts.Signature[], context: CodeGenerationContext, classType?: ts.ObjectType) {
        return new UnresolvedFunctionReference(signatures, new SpeedyJSFunctionFactory(context.compilationContext), classType);
    }

    /**
     * The linkage of the created function
     */
    public linkage = llvm.LinkageTypes.InternalLinkage;

    protected constructor(private signatures: ts.Signature[], protected llvmFunctionFactory: FunctionFactory, classType?: ts.ObjectType) {
        super(classType);
        assert(signatures.length, "Cannot reference a function without a signature");
    }

    protected getResolvedFunction(context: CodeGenerationContext) {
        if (this.signatures.length > 1) {
            throw new Error(`Cannot dereference an overloaded function`);
        }

        const signature = this.signatures[0];

        if (signature.typeParameters.length) {
            throw new Error(`Cannot dereference a generic function`);
        }

        if (!signature.declaration.parameters.every(parameter => !parameter.questionToken)) {
            throw new Error(`Cannot deference a function with optional arguments`);
        }

        return createResolvedFunctionFromSignature(signature, context.compilationContext, this.classType);
    }

    getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: Value[]): llvm.Function {
        const numberOfArguments = passedArguments ? passedArguments.length : resolvedFunction.parameters.length;

        return this.llvmFunctionFactory.getOrCreate(resolvedFunction, numberOfArguments, context, this.linkage);
    }
}

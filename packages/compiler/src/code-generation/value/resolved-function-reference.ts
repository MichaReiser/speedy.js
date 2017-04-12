import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {AbstractFunctionReference} from "./abstract-function-reference";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {FunctionFactory, FunctionProperties} from "./function-factory";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";

/**
 * Reference to a specific overload of a function.
 */
export class ResolvedFunctionReference extends AbstractFunctionReference {

    /**
     * Creates a new reference to the specified runtime function
     * @param resolvedFunction the resolved overload of the runtime function
     * @param context the context
     * @param functionProperties the function properties
     * @return {ResolvedFunctionReference} the reference to the specified runtime function overload
     */
    static createRuntimeFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, functionProperties?: Partial<FunctionProperties>) {
        functionProperties = Object.assign({}, { linkage: llvm.LinkageTypes.ExternalLinkage, inline: true }, functionProperties);
        const llvmFunctionFactory = new FunctionFactory(new RuntimeSystemNameMangler(context.compilationContext));
        const fn = llvmFunctionFactory.getOrCreate(resolvedFunction, resolvedFunction.parameters.length, context, functionProperties);
        return new ResolvedFunctionReference(fn, resolvedFunction);
    }

    /**
     * Creates a new reference to the overload defined by the passed in signature
     * @param fn the llvm function that implements the given signature
     * @param signature the signature of the function
     * @param context the context
     * @return {ResolvedFunctionReference} a reference to the given llvm function with the given signature
     */
    static createForSignature(fn: llvm.Function, signature: ts.Signature, context: CodeGenerationContext) {
        const resolvedFunction = createResolvedFunctionFromSignature(signature, context.compilationContext);
        return new ResolvedFunctionReference(fn, resolvedFunction);
    }

    static create(fn: llvm.Function, resolvedFunction: ResolvedFunction) {
        return new ResolvedFunctionReference(fn, resolvedFunction);
    }

    protected constructor(private fn: llvm.Function, public resolvedFunction: ResolvedFunction) {
        super();
    }

    getResolvedFunction(): ResolvedFunction {
        return this.resolvedFunction;
    }

    protected getLLVMFunction(): llvm.Function {
        return this.fn;
    }
}

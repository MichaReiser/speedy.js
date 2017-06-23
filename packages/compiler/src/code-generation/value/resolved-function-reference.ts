import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {AbstractFunctionReference} from "./abstract-function-reference";
import {FunctionFactory, FunctionProperties} from "./function-factory";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {FunctionPointer} from "./function-reference";

const DEFAULT_RUNTIME_FUNCTION_PROPERTIES = { linkage: llvm.LinkageTypes.ExternalLinkage, alwaysInline: true } as Partial<FunctionProperties>;

/**
 * Reference to a specific overload of a function.
 */
export class ResolvedFunctionReference extends AbstractFunctionReference {

    private fn: FunctionPointer;

    /**
     * Creates a new reference to the specified runtime function
     * @param resolvedFunction the resolved overload of the runtime function
     * @param context the context
     * @param functionProperties the function properties
     * @return {ResolvedFunctionReference} the reference to the specified runtime function overload
     */
    static createRuntimeFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, functionProperties?: Partial<FunctionProperties>) {
        functionProperties = Object.assign({}, DEFAULT_RUNTIME_FUNCTION_PROPERTIES, functionProperties);
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
    static createForSignature(fn: FunctionPointer, signature: ts.Signature, context: CodeGenerationContext) {
        const resolvedFunction = createResolvedFunctionFromSignature(signature, context.compilationContext);
        return new ResolvedFunctionReference(fn, resolvedFunction);
    }

    static create(fn: FunctionPointer, resolvedFunction: ResolvedFunction) {
        return new ResolvedFunctionReference(fn, resolvedFunction);
    }

    protected constructor(fn: llvm.Value, public resolvedFunction: ResolvedFunction) {
        super();
        assert(fn, "Function is missing");
        assert(fn.type.isPointerTy && (fn.type as llvm.PointerType).elementType.isFunctionTy(), "Expected value to be a pointer to a function");

        this.fn = fn as FunctionPointer;
    }

    getResolvedFunction(): ResolvedFunction {
        return this.resolvedFunction;
    }

    protected getLLVMFunction(): FunctionPointer {
        return this.fn;
    }
}

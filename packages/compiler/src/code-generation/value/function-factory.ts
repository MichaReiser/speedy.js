import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {NameMangler} from "../name-mangler";
import {toLLVMType} from "../util/types";
import {ResolvedFunction} from "./resolved-function";
import * as assert from "assert";
import {ObjectReference} from "./object-reference";

/**
 * Factory for creating the declarations of llvm functions
 */
export class FunctionFactory {

    /**
     * Creates a new instance that uses the given name mangler
     * @param nameMangler the name mangler to use
     */
    constructor(private nameMangler: NameMangler) {
    }

    /**
     * Creates the declaration (and if needed the definition) for the given resolved function called with the specified number of arguments
     * @param resolvedFunction the function to call (specific function, not overload)
     * @param numberOfArguments the number of arguments passed to the function (to know where optional arguments are unset)
     * @param context the code generation context
     * @param linkage the linkage of the function
     * @return {Function} the existing function instance or the newly declared function
     */
    getOrCreate(resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, linkage = llvm.LinkageTypes.InternalLinkage): llvm.Function {
        return this.getOrCreateStaticOrInstanceFunction(resolvedFunction, numberOfArguments, context, linkage);
    }

    /**
     * Creates the declaration (and if needed the definition) for the given resolved function called with the specified number of arguments.
     * The declared function is a instance method that needs to be called with the object instance as first argument
     * @param objectReference the object to which the method belongs
     * @param resolvedFunction the resolved function (not overloaded)
     * @param numberOfArguments the number of arguments passed to the function
     * @param context the code generation context
     * @param linkage the linkage of the function
     * @return {Function} the existing or newly declared function
     */
    getOrCreateInstanceMethod(objectReference: ObjectReference, resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, linkage = llvm.LinkageTypes.InternalLinkage) {
        assert(resolvedFunction.instanceMethod && resolvedFunction.classType, "Resolved function needs to be an instance method");

        return this.getOrCreateStaticOrInstanceFunction(resolvedFunction, numberOfArguments, context, linkage, objectReference);
    }

    private getOrCreateStaticOrInstanceFunction(resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, linkage: llvm.LinkageTypes, objectReference?: ObjectReference) {
        const mangledName = this.getMangledFunctionName(resolvedFunction, numberOfArguments);
        let fn = context.module.getFunction(mangledName);

        if (!fn) {
            fn = this.createFunction(mangledName, resolvedFunction, numberOfArguments, context, linkage, objectReference);
        }

        return fn;
    }

    protected createFunction(mangledName: string, resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, linkage: llvm.LinkageTypes, objectReference?: ObjectReference) {
        const llvmArgumentTypes = this.getLLVMArgumentTypes(resolvedFunction, numberOfArguments, context, objectReference);
        const functionType = llvm.FunctionType.get(toLLVMType(resolvedFunction.returnType, context), llvmArgumentTypes, false);
        return llvm.Function.create(functionType, linkage, mangledName, context.module);
    }

    private getMangledFunctionName(resolvedFunction: ResolvedFunction, numberOfArguments: number) {
        let typesOfUsedParameters: ts.Type[] = [];

        for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
            const parameter = resolvedFunction.parameters[i];

            if (parameter.optional && !parameter.initializer && numberOfArguments <= i) {
                break; // Optional parameter that is not set. Therefore, this parameter is not actually used
            }
            typesOfUsedParameters.push(parameter.type);
        }

        return this.mangleFunctionName(resolvedFunction, typesOfUsedParameters);
    }

    protected mangleFunctionName(resolvedFunction: ResolvedFunction, typesOfUsedParameters: ts.Type[]) {
        if (resolvedFunction.classType) {
            return this.nameMangler.mangleMethodName(resolvedFunction.classType, resolvedFunction.functionName, typesOfUsedParameters, resolvedFunction.sourceFile);
        }

        return this.nameMangler.mangleFunctionName(resolvedFunction.functionName, typesOfUsedParameters, resolvedFunction.sourceFile);
    }

    private getLLVMArgumentTypes(resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, objectReference?: ObjectReference) {
        const argumentTypes = objectReference ? [toLLVMType(objectReference.type, context) ] : [];

        for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
            const parameter = resolvedFunction.parameters[i];

            if (parameter.variadic) {
                const elementType = (parameter.type as ts.GenericType).typeArguments[0];
                argumentTypes.push(toLLVMType(elementType, context).getPointerTo(), llvm.Type.getInt32Ty(context.llvmContext));
                break;
            } else if (parameter.optional && !parameter.initializer && numberOfArguments <= i) {
                // optional argument that is not set, skip
                break;
            } else {
                argumentTypes.push(toLLVMType(parameter.type, context));
            }
        }

        return argumentTypes;
    }
}

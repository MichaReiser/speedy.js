import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {llvmArrayValue} from "../util/llvm-array-helpers";
import {getArrayElementType, toLLVMType} from "../util/types";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {AssignableValue, Value} from "./value";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

/**
 * Base class for function references. Handles the coercion of the argument values to the expected types of the function parametes
 * and as well as handling var arg parameters correctly.
 */
export abstract class AbstractFunctionReference implements FunctionReference {

    /**
     * Creates a new instance
     * @param classType the type of the class to which this function belongs (static or instance method) or absent, if it is
     * a stand alone function.
     */
    constructor(protected classType?: ts.ObjectType) {}

    /**
     * Returns the default resolved function in case this function reference is dereferenced (e.g. assigned to a variable).
     * @throws in case this function is overloaded and therefore, cannot be dereferenced
     */
    protected abstract getResolvedFunction(callerContext: CodeGenerationContext): ResolvedFunction;

    /**
     * Returns the llvm function for the given resolved function and passed arguments
     * @param resolvedFunction the resolved function
     * @param context the context
     * @param passedArguments the arguments passed
     */
    protected abstract getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: llvm.Value[]): llvm.Function;

    invoke(callExpression: ts.CallExpression | ts.NewExpression, callerContext: CodeGenerationContext): void | Value {
        const resolvedSignature = callerContext.typeChecker.getResolvedSignature(callExpression);
        const resolvedFunction = this.getResolvedFunctionFromSignature(resolvedSignature, callerContext.compilationContext);

        const passedArguments = this.getLLVMArgumentValues(callExpression.arguments || [] as ts.Expression[], resolvedFunction, callerContext);
        return this.invokeResolvedFunction(resolvedFunction, passedArguments, callerContext);
    }

    invokeWith(args: llvm.Value[], callerContext: CodeGenerationContext): void | Value {
        return this.invokeResolvedFunction(this.getResolvedFunction(callerContext), args, callerContext);
    }

    protected getResolvedFunctionFromSignature(signature: ts.Signature, compilationContext: CompilationContext): ResolvedFunction {
        return createResolvedFunctionFromSignature(signature, compilationContext, this.classType);
    }

    protected getLLVMArgumentValues(args: ts.Expression[], resolvedFunction: ResolvedFunction, callerContext: CodeGenerationContext) {
        let values: llvm.Value[] = [];
        for (let i = 0; i < Math.min(args.length, resolvedFunction.parameters.length); ++i) {
            const parameter = resolvedFunction.parameters[i];
            const parameterType = parameter.type;
            const arg = args[i];
            const argumentType = callerContext.typeChecker.getTypeAtLocation(arg);

            if (parameter.variadic) {
                const varArgs = args.slice(i);
                const elementType = getArrayElementType(parameterType);

                const elementNotMatchingArrayElementType = varArgs.find(varArg => !callerContext.typeChecker.isAssignableTo(callerContext.typeChecker.getTypeAtLocation(varArg), elementType));
                if (typeof elementNotMatchingArrayElementType !== "undefined") {
                    throw CodeGenerationDiagnostic.unsupportedImplicitCastOfArgument(elementNotMatchingArrayElementType, callerContext.typeChecker.typeToString(elementType), callerContext.typeChecker.typeToString(callerContext.typeChecker.getTypeAtLocation(elementNotMatchingArrayElementType)));
                }

                values.push(...varArgs.map(varArg => callerContext.generateValue(varArg).generateIR(callerContext)));
            } else {
                if (!callerContext.typeChecker.isAssignableTo(argumentType, parameterType)) {
                    throw CodeGenerationDiagnostic.unsupportedImplicitCastOfArgument(arg, callerContext.typeChecker.typeToString(parameterType), callerContext.typeChecker.typeToString(argumentType));
                }

                values.push(callerContext.generateValue(arg).generateIR(callerContext));
            }
        }

        return values;
    }

    private invokeResolvedFunction(resolvedFunction: ResolvedFunction, args: llvm.Value[], callerContext: CodeGenerationContext) {
        const llvmFunction = this.getLLVMFunction(resolvedFunction, callerContext, args);
        const callArguments = this.getCallArguments(resolvedFunction, args, callerContext);

        const name = resolvedFunction.returnType.flags & ts.TypeFlags.Void ? undefined : `${resolvedFunction.functionName}ReturnValue`;

        assert(callArguments.length === llvmFunction.getArguments().length, "Calling function with less than expected number of arguments");
        const call = callerContext.builder.createCall(llvmFunction, callArguments, name);

        if (resolvedFunction.returnType.flags & ts.TypeFlags.Void) {
            return;
        } else if (resolvedFunction.returnType.flags & ts.TypeFlags.Object) {
            const classReference = callerContext.resolveClass(resolvedFunction.returnType)!;
            call.addDereferenceableAttr(0, classReference.getTypeStoreSize(resolvedFunction.returnType as ts.ObjectType, callerContext));
        }

        return callerContext.value(call, resolvedFunction.returnType);
    }

    /**
     * Gets the call arguments for invoking the specified function
     * @param resolvedFunction the specific signature of the function to call
     * @param passedArguments the parameters passed in the invoke statement
     * @param callerContext the callers code generation context
     * @return the values that are to be passed to the llvm function
     */
    protected getCallArguments(resolvedFunction: ResolvedFunction, passedArguments: llvm.Value[], callerContext: CodeGenerationContext): llvm.Value[] {
        let result: llvm.Value[] = [];

        for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
            const parameter = resolvedFunction.parameters[i];

            let arg: llvm.Value | undefined;

            if (passedArguments.length > i) {
                arg = passedArguments[i];
            } else if (parameter.initializer) {
                arg = callerContext.generateValue(parameter.initializer).generateIR(callerContext);
            } else if (parameter.optional) {
                break;
            } else if (!parameter.variadic) {
                assert(false, `Missing value for not optional parameter ${parameter.name}`);
                break;
            }

            if (parameter.variadic) {
                const arrayType = (parameter.type as ts.GenericType);
                const elementType = getArrayElementType(arrayType);

                result.push(
                    llvmArrayValue(passedArguments.slice(i), toLLVMType(elementType, callerContext), callerContext, parameter.name),
                    llvm.ConstantInt.get(callerContext.llvmContext, passedArguments.length - i, undefined, false)
                );

                break;
            } else {
                result.push(arg!);
            }
        }

        return result;
    }

    isAssignable(): this is AssignableValue {
        return false;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(): this {
        return this;
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.getLLVMFunction(this.getResolvedFunction(context), context);
    }
}

import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {getArrayElementType, toLLVMType} from "../util/types";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {AssignableValue, Value} from "./value";
import {Primitive} from "./primitive";
import {llvmArrayValue} from "../util/llvm-array-helpers";
import {createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {CompilationContext} from "../../compilation-context";

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
    protected abstract getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: Value[]): llvm.Function;

    invoke(callExpression: ts.CallExpression | ts.NewExpression, callerContext: CodeGenerationContext): void | Value {
        const resolvedSignature = callerContext.typeChecker.getResolvedSignature(callExpression);
        const resolvedFunction = this.getResolvedFunctionFromSignature(resolvedSignature, callerContext.compilationContext);

        const passedArguments = this.getCoercedCallArguments(callExpression.arguments || [] as ts.Node[], resolvedFunction, callerContext);
        return this.invokeResolvedFunction(resolvedFunction, passedArguments, callerContext);
    }

    invokeWith(args: Value[], callerContext: CodeGenerationContext): void | Value {
        return this.invokeResolvedFunction(this.getResolvedFunction(callerContext), args, callerContext);
    }

    protected getResolvedFunctionFromSignature(signature: ts.Signature, compilationContext: CompilationContext): ResolvedFunction {
        return createResolvedFunctionFromSignature(signature, compilationContext, this.classType);
    }

    protected getCoercedCallArguments(args: ts.Node[], resolvedFunction: ResolvedFunction, callerContext: CodeGenerationContext) {
        let values: Value[] = [];
        for (let i = 0; i < Math.min(args.length, resolvedFunction.parameters.length); ++i) {
            const parameter = resolvedFunction.parameters[i];
            const parameterType = parameter.type;
            const arg = args[i];

            if (parameter.variadic) {
                const varArgs = args.slice(i);
                const elementType = getArrayElementType(parameterType);
                values.push(...varArgs.map(varArg => this.coerceArgument(varArg, elementType, callerContext)));
            } else {
                values.push(this.coerceArgument(arg, parameterType, callerContext));
            }
        }

        return values;
    }

    private coerceArgument(arg: ts.Node, parameterType: ts.Type, callerContext: CodeGenerationContext) {
        const argType = callerContext.typeChecker.getTypeAtLocation(arg);
        const argValue = callerContext.generateValue(arg);

        if (parameterType.flags & ts.TypeFlags.Number && (argType.flags & (ts.TypeFlags.IntLike | ts.TypeFlags.BooleanLike))) {
            const value = argValue.generateIR(callerContext);
            return new Primitive(callerContext.builder.createSIToFP(value, llvm.Type.getDoubleTy(callerContext.llvmContext), `${value.name}AsDouble`), parameterType);
        } else if (parameterType.flags & ts.TypeFlags.Int && argType.flags & ts.TypeFlags.BooleanLike) {
            const value = argValue.generateIR(callerContext);
            return new Primitive(callerContext.builder.createZExt(value, llvm.Type.getInt32Ty(callerContext.llvmContext), `${value.name}AsInt`), parameterType);
        }

        return argValue;
    }

    private invokeResolvedFunction(resolvedFunction: ResolvedFunction, args: Value[], callerContext: CodeGenerationContext) {
        const llvmFunction = this.getLLVMFunction(resolvedFunction, callerContext, args);
        const callArguments = this.getCallArguments(resolvedFunction, args, callerContext);
        const name = resolvedFunction.returnType.flags & ts.TypeFlags.Void ? undefined : `${resolvedFunction.functionName}ReturnValue`;

        return callerContext.call(llvmFunction, callArguments, resolvedFunction.returnType, name);
    }

    /**
     * Gets the call arguments for invoking the specified function
     * @param resolvedFunction the specific signature of the function to call
     * @param passedArguments the parameters passed in the invoke statement
     * @return the values that are to be passed to the llvm function
     */
    protected getCallArguments(resolvedFunction: ResolvedFunction, passedArguments: Value[], callerContext: CodeGenerationContext): llvm.Value[] {
        let result: llvm.Value[] = [];
        let llvmArgs = passedArguments.map(arg => arg.generateIR(callerContext));

        for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
            const parameter = resolvedFunction.parameters[i];

            let arg: llvm.Value | undefined;

            if (passedArguments.length > i) {
                arg = llvmArgs[i];
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
                    llvmArrayValue(llvmArgs.slice(i), toLLVMType(elementType, callerContext), callerContext, parameter.name),
                    llvm.ConstantInt.get(callerContext.llvmContext, passedArguments.length - i)
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

import * as assert from "assert";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {FunctionPointer} from "../value/function-reference";

export interface InvokeOptions {
    name?: string;
    dereferenceableSize?: number;
}

export function invoke(callee: FunctionPointer, args: llvm.Value[], returnType: llvm.Type, callerContext: CodeGenerationContext, options?: InvokeOptions) {
    const functionType = callee.type.elementType;
    const initializedOptions = options || {};

    assert(args.length === functionType.numParams, `Calling function with less arguments than declared parameters`);

    args = args.map((arg, i) => {
        const parameterType = functionType.getParamType(i);

        if (arg.type.isPointerTy() && !arg.type.equals(parameterType)) {
            arg = callerContext.builder.createBitCast(arg, parameterType);
        }

        assert(arg.type.equals(parameterType), `Argument type ${arg.type} does not equal declared parameter type ${parameterType}`);
        return arg;
    });

    const call = callerContext.builder.createCall(callee, args, initializedOptions.name);
    let returnValue: llvm.Value = call;

    if (typeof (initializedOptions.dereferenceableSize) === "number") {
        call.addDereferenceableAttr(0, initializedOptions.dereferenceableSize);
    }

    if (!returnType.isVoidTy()) {
        if (returnType.isPointerTy() && !call.type.equals(returnType)) {
            returnValue = callerContext.builder.createBitCast(call, returnType);
        }
    }

    assert(returnValue.type.equals(returnType), `The value returned by the function ${returnValue.type} does not equal the expected return type ${returnType}`);

    return returnValue;
}

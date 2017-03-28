import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {Value} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/type-mapping";

/**
 * Reference to a function
 */
export class FunctionReference implements Value {

    static invoke(fn: llvm.Function, args: Value[] | llvm.Value[], returnType: ts.Type, context: CodeGenerationContext): Value | void {
        let llvmArgs: llvm.Value[];

        if (args.length === 0 || args[0] instanceof llvm.Value) {
            llvmArgs = args as llvm.Value[];
        } else {
            llvmArgs = (args as Value[]).map(arg => arg.generateIR());
        }

        assert(args.length === fn.getArguments().length, "Calling functions with more or less arguments than declared parameters is not supported");

        const result = context.builder.createCall(fn, llvmArgs);

        if (returnType.flags & ts.TypeFlags.Void) {
            return;
        }

        return context.value(result, returnType);
    }

    static createForCall(callExpression: ts.CallExpression, context: CodeGenerationContext): FunctionReference {
        const signature = context.typeChecker.getResolvedSignature(callExpression);

        const argumentTypes = callExpression.arguments.map(arg => context.typeChecker.getTypeAtLocation(arg));
        return FunctionReference.create(signature, argumentTypes, context);
    }

    static create(signature: ts.Signature, argumentTypes: ts.Type[], context: CodeGenerationContext): FunctionReference {
        assert(signature.getDeclaration().name, "Anonymous functions are not yet supported");

        const symbol = context.typeChecker.getSymbolAtLocation(signature.getDeclaration().name!);
        // const name = context.compilationContext.nameMangler.mangleRuntimeFunctionName(symbol.name, argumentTypes);

        let fn = context.module.getFunction(symbol.name);

        if (!fn) {
            const llvmArgumentTypes = argumentTypes.map(argumentType => toLLVMType(argumentType, context));
            fn = llvm.Function.create(llvm.FunctionType.get(toLLVMType(signature.getReturnType(), context), llvmArgumentTypes, false), llvm.LinkageTypes.ExternalWeakLinkage, symbol.name, context.module);
        }

        return new FunctionReference(fn, signature.getReturnType(), context);
    }

    constructor(private fn: llvm.Function, private returnType: ts.Type, protected context: CodeGenerationContext) {
    }

    /**
     * Returns the underlining llvm function
     * @return {llvm.Function} the llvm function
     */
    getLLVMFunction() {
        return this.fn;
    }

    generateIR(): llvm.Function {
        return this.fn;
    }

    isAssignable() {
        return false;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference() {
        return this;
    }

    /**
     * Invokes the function with the given arguments
     * @param args the arguments used to invoke the function
     * @return {Value|void} the value returned by the function
     */
    invoke(args: Value[] | llvm.Value[]): Value | void {
        const llvmArgs = args.length === 0 || args[0] instanceof llvm.Value ? args as llvm.Value[]: (args as Value[]).map(arg => arg.generateIR());
        const callArgs = this.getCallArguments(llvmArgs);

        return this.invokeWithArgs(callArgs);
    }

    protected invokeWithArgs(args: llvm.Value[]) {
        return FunctionReference.invoke(this.fn, args, this.returnType, this.context);
    }

    protected getCallArguments(args: llvm.Value[]): llvm.Value[] {
        return args;
    }
}

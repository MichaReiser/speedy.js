import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {Value} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";

export class FunctionReference implements Value {
    constructor(private fn: llvm.Function, private signature: ts.Signature, protected context: CodeGenerationContext) {
    }

    get symbol(): ts.Symbol | undefined {
        const declaration = this.signature.getDeclaration();
        return declaration.name ? this.context.typeChecker.getSymbolAtLocation(declaration.name) : undefined;
    }

    get declaration(): ts.Declaration {
        return this.signature.declaration;
    }

    get returnType(): ts.Type {
        return this.signature.getReturnType();
    }

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

    invoke(args: Value[] | llvm.Value[]): Value | void {
        const llvmArgs = args.length === 0 || args[0] instanceof llvm.Value ? args as llvm.Value[]: (args as Value[]).map(arg => arg.generateIR());
        const callArgs = this.getCallArguments(llvmArgs);

        return this.invokeWithArgs(callArgs);
    }

    protected invokeWithArgs(args: llvm.Value[]) {
        assert(args.length === this.fn.getArguments().length, "Calling functions with more or less arguments than declared parameters is not yet supported");

        return FunctionReference.invoke(this.fn, args, this.returnType, this.context);
    }

    protected getCallArguments(args: llvm.Value[]): llvm.Value[] {
        return args;
    }

    static invoke(fn: llvm.Constant, args: Value[] | llvm.Value[], returnType: ts.Type, context: CodeGenerationContext): Value | void {
        let llvmArgs: llvm.Value[];

        if (args.length === 0 || args[0] instanceof llvm.Value) {
            llvmArgs = args as llvm.Value[];
        } else {
            llvmArgs = (args as Value[]).map(arg => arg.generateIR());
        }

        const result = context.builder.createCall(fn, llvmArgs);

        if (returnType.flags & ts.TypeFlags.Void) {
            return;
        }

        return context.value(result, returnType);
    }
}

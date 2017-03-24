import * as llvm from "llvm-node";
import * as ts from "typescript";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "./value";

export class MethodReference extends FunctionReference {
    constructor(private object: ObjectReference, fn: llvm.Function, signature: ts.Signature, context: CodeGenerationContext) {
        super(fn, signature, context);
    }

    invoke(args: Value[] | llvm.Value[]): Value {
        const llvmArgs = args.length === 0 || args[0] instanceof llvm.Value ? args as llvm.Value[]: (args as Value[]).map(arg => arg.generateIR());
        const callArgs = this.getCallArguments(llvmArgs);

        return super.invoke([this.object.generateIR(), ...callArgs]);
    }
}

import * as llvm from "llvm-node";
import * as ts from "typescript";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {Value} from "./value";

export class MethodReference extends FunctionReference {

    constructor(private object: ObjectReference, fn: llvm.Function, returnType: ts.Type, context: CodeGenerationContext) {
        super(fn, returnType, context);
    }

    invoke(args: Value[] | llvm.Value[]): Value | void {
        const llvmArgs = args.length === 0 || args[0] instanceof llvm.Value ? args as llvm.Value[]: (args as Value[]).map(arg => arg.generateIR());
        const callArgs = this.getCallArguments(llvmArgs);

        return super.invokeWithArgs([this.object.generateIR(), ...callArgs]);
    }
}

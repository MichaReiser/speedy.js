import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {FunctionFactory} from "./function-factory";
import {ObjectReference} from "./object-reference";
import {ResolvedFunction} from "./resolved-function";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";
import {Value} from "./value";

/**
 * Reference to a possibly overloaded instance method
 */
export class UnresolvedMethodReference extends UnresolvedFunctionReference {

    /**
     * Creates a reference to an instance method in the runtime
     * @param object the object
     * @param signatures the signatures of the method
     * @param context the context
     * @return {UnresolvedMethodReference} the reference to this method
     */
    static createRuntimeMethod(object: ObjectReference, signatures: ts.Signature[], context: CodeGenerationContext) {
        const reference = new UnresolvedMethodReference(object, signatures, new FunctionFactory(new RuntimeSystemNameMangler(context.compilationContext)));
        reference.linkage = llvm.LinkageTypes.ExternalLinkage;
        return reference;
    }

    protected constructor(private object: ObjectReference, signatures: ts.Signature[], llvmFunctionFactory: FunctionFactory) {
        super(signatures, llvmFunctionFactory, object.type);
    }

    getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: Value[]): llvm.Function {
        const numberOfArguments = passedArguments ? passedArguments.length : resolvedFunction.parameters.length;

        return this.llvmFunctionFactory.getOrCreateInstanceMethod(resolvedFunction, numberOfArguments, context, this.linkage);
    }

    protected getCallArguments(resolvedFunction: ResolvedFunction, passedArguments: Value[], callerContext: CodeGenerationContext): llvm.Value[] {
        return [this.object.generateIR(callerContext), ...super.getCallArguments(resolvedFunction, passedArguments, callerContext)];
    }
}

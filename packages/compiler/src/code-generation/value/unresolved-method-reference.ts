import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {FunctionFactory, FunctionProperties} from "./function-factory";
import {ObjectReference} from "./object-reference";
import {ResolvedFunction} from "./resolved-function";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";
import {Value} from "./value";
import {SpeedyJSFunctionFactory} from "./speedyjs-function-factory";

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
        const functionFactory = new FunctionFactory(new RuntimeSystemNameMangler(context.compilationContext));
        return new UnresolvedMethodReference(object, signatures, functionFactory, { linkage: llvm.LinkageTypes.ExternalLinkage, alwaysInline: true });
    }

    /**
     * Creates a reference to a method that has the specified overloads
     * @param object the object to which the method belongs
     * @param signatures the signatures of the method
     * @param context the context
     * @return the reference to the method
     */
    static createMethod(object: ObjectReference, signatures: ts.Signature[], context: CodeGenerationContext) {
        return new UnresolvedMethodReference(object, signatures, new SpeedyJSFunctionFactory(context.compilationContext));
    }

    protected constructor(private object: ObjectReference, signatures: ts.Signature[], llvmFunctionFactory: FunctionFactory, properties?: Partial<FunctionProperties>) {
        super(signatures, llvmFunctionFactory, object.type, properties);
    }

    getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: Value[]): llvm.Function {
        const numberOfArguments = passedArguments ? passedArguments.length : resolvedFunction.parameters.length;

        return this.llvmFunctionFactory.getOrCreateInstanceMethod(this.object, resolvedFunction, numberOfArguments, context, this.properties);
    }

    protected getCallArguments(resolvedFunction: ResolvedFunction, passedArguments: Value[], callerContext: CodeGenerationContext): llvm.Value[] {
        const functionArguments = [
            ...super.getCallArguments(resolvedFunction, passedArguments, callerContext),
        ];
        return [this.object.generateIR(callerContext), ...functionArguments];
    }
}

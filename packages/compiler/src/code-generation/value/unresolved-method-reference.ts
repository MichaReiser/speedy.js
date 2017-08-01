import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {FunctionFactory, FunctionProperties} from "./function-factory";
import {ObjectReference} from "./object-reference";
import {ResolvedFunction} from "./resolved-function";
import {SpeedyJSFunctionFactory} from "./speedyjs-function-factory";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";

/**
 * Reference to a possibly overloaded instance method
 */
export class UnresolvedMethodReference extends UnresolvedFunctionReference {

    /**
     * Creates a reference to an instance method in the runtime
     * @param object the object
     * @param signatures the signatures of the method
     * @param context the context
     * @param properties the function properties
     * @return {UnresolvedMethodReference} the reference to this method
     */
    static createRuntimeMethod(object: ObjectReference, signatures: ts.Signature[], context: CodeGenerationContext, properties?: Partial<FunctionProperties>) {
        const functionFactory = new FunctionFactory(new RuntimeSystemNameMangler(context.compilationContext), context.runtimeTypeConverter);
        properties = Object.assign({ linkage: llvm.LinkageTypes.ExternalLinkage, alwaysInline: true }, properties);
        return new UnresolvedMethodReference(object, signatures, functionFactory, properties);
    }

    /**
     * Creates a reference to a method that has the specified overloads
     * @param object the object to which the method belongs
     * @param signatures the signatures of the method
     * @param context the context
     * @return the reference to the method
     */
    static createMethod(object: ObjectReference, signatures: ts.Signature[], context: CodeGenerationContext) {
        return new UnresolvedMethodReference(object, signatures, new SpeedyJSFunctionFactory(context));
    }

    protected constructor(private object: ObjectReference,
                          signatures: ts.Signature[],
                          llvmFunctionFactory: FunctionFactory,
                          properties?: Partial<FunctionProperties>) {
        super(signatures, llvmFunctionFactory, object.type, properties);
    }

    protected getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: llvm.Value[]): llvm.Function {
        const numberOfArguments = passedArguments ? passedArguments.length : resolvedFunction.parameters.length;

        return this.llvmFunctionFactory.getOrCreateInstanceMethod(this.object, resolvedFunction, numberOfArguments, context, this.properties);
    }

    protected getCallArguments(resolvedFunction: ResolvedFunction, passedArguments: llvm.Value[], callerContext: CodeGenerationContext): llvm.Value[] {
        return [this.object.generateIR(callerContext), ...super.getCallArguments(resolvedFunction, passedArguments, callerContext)];
    }
}

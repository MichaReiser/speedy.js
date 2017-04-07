import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {FunctionDefinitionBuilder} from "../util/function-definition-builder";
import {FunctionFactory} from "./function-factory";
import {ResolvedFunction} from "./resolved-function";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";

/**
 * Function factory for functions marked with "speedyjs"
 */
export class SpeedyJSFunctionFactory extends FunctionFactory {

    constructor(compilationContext: CompilationContext) {
        super(new DefaultNameMangler(compilationContext));
    }

    protected mangleFunctionName(resolvedFunction: ResolvedFunction, typesOfUsedParameters: ts.Type[]) {
        if (resolvedFunction.async) {
            return resolvedFunction.functionName;
        }

        return super.mangleFunctionName(resolvedFunction, typesOfUsedParameters);
    }

    protected createFunction(mangledName: string, resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, linkage: llvm.LinkageTypes, objectReference?: ObjectReference) {
        const declaration = resolvedFunction.declaration as ts.FunctionDeclaration;
        assert(declaration, "Cannot define a function without a declaration");
        assert(declaration.body, "Cannot define a function without a body");

        const fn = super.createFunction(mangledName, resolvedFunction, numberOfArguments, context, linkage, objectReference);

        const childContext = context.createChildContext();
        FunctionDefinitionBuilder.create(fn, resolvedFunction, childContext)
            .object(objectReference)
            .define(declaration);

        return fn;
    }
}

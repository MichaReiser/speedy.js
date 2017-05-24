import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {FunctionDefinitionBuilder} from "../util/function-definition-builder";
import {FunctionFactory, FunctionProperties} from "./function-factory";
import {ResolvedFunction} from "./resolved-function";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

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

    protected getDefaultFunctionProperties(): FunctionProperties {
        return Object.assign({}, super.getDefaultFunctionProperties(), {
            visibility: llvm.VisibilityTypes.Hidden
        });
    }

    protected createFunction(mangledName: string, resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, properties: FunctionProperties, objectReference?: ObjectReference) {
        const definition = resolvedFunction.definition as ts.FunctionDeclaration;
        assert(definition, "Functions only with a declaration cannot be defined");

        this.verifyIsSupportedDeclaration(definition);

        assert(definition.body, "Cannot define a function without a body");

        const fn = super.createFunction(mangledName, resolvedFunction, numberOfArguments, context, properties, objectReference);

        const childContext = context.createChildContext();
        FunctionDefinitionBuilder.create(fn, resolvedFunction, childContext).define();

        return fn;
    }

    private verifyIsSupportedDeclaration(declaration: ts.Declaration) {
        if (!(declaration.kind === ts.SyntaxKind.FunctionDeclaration || declaration.kind === ts.SyntaxKind.MethodDeclaration)) {
            throw CodeGenerationDiagnostic.unsupportedFunctionDeclaration(declaration);
        }

        const functionDeclaration = declaration as ts.FunctionDeclaration | ts.MethodDeclaration;

        if (functionDeclaration.typeParameters && functionDeclaration.typeParameters.length > 0) {
            throw CodeGenerationDiagnostic.unsupportedGenericFunction(functionDeclaration);
        }

        if (functionDeclaration.kind === ts.SyntaxKind.FunctionDeclaration && functionDeclaration.parent && functionDeclaration.parent.kind !== ts.SyntaxKind.SourceFile) {
            throw CodeGenerationDiagnostic.unsupportedNestedFunctionDeclaration(functionDeclaration);
        }
    }
}

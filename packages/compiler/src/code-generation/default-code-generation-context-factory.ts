import * as assert from "assert";
import * as debug from "debug";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {CodeGenerationContext} from "./code-generation-context";

import {CodeGenerationContextFactory} from "./code-generation-context-factory";
import {DefaultCodeGenerationContext} from "./default-code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {SyntaxCodeGenerator} from "./syntax-code-generator";
import {ArrayClassReference} from "./value/array-class-reference";
import {MathClassReference} from "./value/math-class-reference";
import {Primitive} from "./value/primitive";
import {UnresolvedFunctionReference} from "./value/unresolved-function-reference";
import {Value} from "./value/value";

const log = debug("DefaultLLVMEmitContextFactory");

/**
 * Default code generation factory that loads the code generators 'code generators' directory.
 */
export class DefaultCodeGenerationContextFactory implements CodeGenerationContextFactory {

    private codeGenerators?: Array<SyntaxCodeGenerator<ts.Node, Value | void>>;

    constructor(private fallbackCodeGenerator?: FallbackCodeGenerator) {}

    createContext(compilationContext: CompilationContext, module: llvm.Module): CodeGenerationContext {
        const context = new DefaultCodeGenerationContext(compilationContext, module);

        const codeGenerators = this.getCodeGenerators();

        for (const codeGenerator of codeGenerators) {
            context.registerCodeGenerator(codeGenerator);
        }

        context.setFallbackCodeGenerator(this.fallbackCodeGenerator);

        this.registerGlobals(context);

        return context;
    }

    private registerGlobals(context: CodeGenerationContext): void {
        const builtins = context.compilationContext.builtIns;

        const arraySymbol = builtins.get("Array");
        if (arraySymbol) {
            const arrayClassReference = ArrayClassReference.create(arraySymbol, context);
            context.scope.addClass(arraySymbol, arrayClassReference);
            context.scope.addClass(builtins.get("ArrayConstructor")!, arrayClassReference);
        }

        const mathSymbol = builtins.get("Math");
        if (mathSymbol) {
            const mathClassReference = MathClassReference.create(mathSymbol, context);
            context.scope.addClass(mathSymbol, mathClassReference);
            context.scope.addVariable(mathSymbol, mathClassReference.createGlobalVariable(mathSymbol, context));
        }

        const nan = builtins.get("NaN");
        if (nan) {
            const nanValue = llvm.ConstantFP.getNaN(llvm.Type.getDoubleTy(context.llvmContext));
            context.scope.addVariable(nan, new Primitive(nanValue, context.typeChecker.getTypeAtLocation(nan.valueDeclaration!)));
        }

        const isNanSymbol = builtins.get("isNaN");
        if (isNanSymbol) {
            context.scope.addFunction(isNanSymbol, UnresolvedFunctionReference.createRuntimeFunction([
                context.typeChecker.getSignatureFromDeclaration(isNanSymbol.valueDeclaration as ts.FunctionDeclaration)
            ], context));
        }
    }

    private getCodeGenerators(): Array<SyntaxCodeGenerator<ts.Node, Value | void>> {
        if (!this.codeGenerators) {
            this.codeGenerators = this.loadCodeGenerators();
        }

        return this.codeGenerators;
    }

    private loadCodeGenerators(): Array<SyntaxCodeGenerator<ts.Node, Value | void>> {
        const fileNames = fs.readdirSync(`${__dirname}/code-generators`);
        const codeGeneratorFiles = fileNames.filter(file => file.endsWith("code-generator.js"));

        return codeGeneratorFiles.map(codeGeneratorFile => {
            const codeGeneratorModule = require(`${__dirname}/code-generators/${codeGeneratorFile}`) as any;
            assert(codeGeneratorModule && codeGeneratorModule.default, `Code generator module ${codeGeneratorFile} lacks mandatory default export`);

            const constructorFunction = codeGeneratorModule.default;
            assert(constructorFunction instanceof Function, `Default export of code generator module ${codeGeneratorFile} is not a constructor`);
            // tslint:disable-next-line: max-line-length
            assert(constructorFunction.prototype.generate, `Default exported object from module ${codeGeneratorFile} is not a CodeGenerator as it lacks the generate method.`);

            log("Dynamically loaded code generator %s", codeGeneratorFile);

            return new constructorFunction() as SyntaxCodeGenerator<ts.Node, Value | void>;
        });
    }
}

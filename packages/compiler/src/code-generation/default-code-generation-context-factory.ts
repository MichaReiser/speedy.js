import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as fs from "fs";
import * as debug from "debug";
import * as assert from "assert";

import {CodeGenerationContextFactory} from "./code-generation-context-factory";
import {CodeGenerationContext} from "./code-generation-context";
import {DefaultCodeGenerationContext} from "./default-code-generation-context";
import {SyntaxCodeGenerator} from "./syntax-code-generator";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {CompilationContext} from "../compilation-context";
import {ArrayClassReference} from "./value/array-class-reference";
import {MathClassReference} from "./value/math-class-reference";
import {Value} from "./value/value";
import {Primitive} from "./value/primitive";

const log = debug("DefaultLLVMEmitContextFactory");

/**
 * Default code generation factory that loads the code generators 'code generators' directory.
 */
export class DefaultCodeGenerationContextFactory implements CodeGenerationContextFactory {

    private codeGenerators?: SyntaxCodeGenerator<ts.Node, Value | void>[];

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
            context.scope.addVariable(nan, new Primitive(llvm.ConstantFP.getNaN(llvm.Type.getDoubleTy(context.llvmContext)), context.typeChecker.getTypeAtLocation(nan.valueDeclaration!)));
        }
    }

    private getCodeGenerators(): SyntaxCodeGenerator<ts.Node, Value | void>[] {
        if (!this.codeGenerators) {
            this.codeGenerators = this.loadCodeGenerators();
        }

        return this.codeGenerators;
    }

    private loadCodeGenerators(): SyntaxCodeGenerator<ts.Node, Value | void>[] {
        const fileNames = fs.readdirSync(`${__dirname}/code-generators`);
        const codeGeneratorFiles = fileNames.filter(file => file.endsWith("code-generator.js"));

        return codeGeneratorFiles.map(codeGeneratorFile => {
            const codeGeneratorModule = require(`${__dirname}/code-generators/${codeGeneratorFile}`) as any;
            assert(codeGeneratorModule && codeGeneratorModule.default, `Code generator module ${codeGeneratorFile} lacks mandatory default export`);

            const constructorFunction = codeGeneratorModule.default;
            assert(constructorFunction instanceof Function, `Default export of code generator module ${codeGeneratorFile} is not a constructor`);
            assert(constructorFunction.prototype.generate, `Default exported object from module ${codeGeneratorFile} is no CodeGenerator as it lacks the generate method.`);

            log("Dynamically loaded code generator %s", codeGeneratorFile);

            return new constructorFunction() as SyntaxCodeGenerator<ts.Node, Value | void>;
        });
    }
}

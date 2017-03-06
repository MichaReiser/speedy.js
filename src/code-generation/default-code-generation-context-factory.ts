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

const log = debug("DefaultLLVMEmitContextFactory");

/**
 * Default code generation factory that loads the code generators 'code generators' directory.
 */
export class DefaultCodeGenerationContextFactory implements CodeGenerationContextFactory {

    private codeGenerators?: SyntaxCodeGenerator<ts.Node>[];

    constructor(private fallbackCodeGenerator?: FallbackCodeGenerator) {}

    createContext(program: ts.Program, llvmContext: llvm.LLVMContext, module: llvm.Module): CodeGenerationContext {
        const context = new DefaultCodeGenerationContext(program, llvmContext, module);

        const codeGenerators = this.getCodeGenerators();

        for (const codeGenerator of codeGenerators) {
            context.registerCodeGenerator(codeGenerator);
        }

        context.setFallbackCodeGenerator(this.fallbackCodeGenerator);

        return context;
    }

    private getCodeGenerators(): SyntaxCodeGenerator<ts.Node>[] {
        if (!this.codeGenerators) {
            this.codeGenerators = this.loadCodeGenerators();
        }

        return this.codeGenerators;
    }

    private loadCodeGenerators(): SyntaxCodeGenerator<ts.Node>[] {
        const fileNames = fs.readdirSync(`${__dirname}/code-generators`);
        const codeGeneratorFiles = fileNames.filter(file => file.endsWith("code-generator.js"));

        return codeGeneratorFiles.map(codeGeneratorFile => {
            const codeGeneratorModule = require(`${__dirname}/code-generators/${codeGeneratorFile}`) as any;
            assert(codeGeneratorModule && codeGeneratorModule.default, `Code generator module ${codeGeneratorFile} lacks mandatory default export`);

            const constructorFunction = codeGeneratorModule.default;
            assert(constructorFunction instanceof Function, `Default export of code generator module ${codeGeneratorFile} is not a constructor`);
            assert(constructorFunction.prototype.generate, `Default exported object from module ${codeGeneratorFile} is no CodeGenerator as it lacks the generate method.`);

            log("Dynamically loaded code generator %s", codeGeneratorFile);

            return new constructorFunction() as SyntaxCodeGenerator<ts.Node>;
        });
    }
}

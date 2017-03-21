import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import * as debug from "debug";
import {SyntaxCodeGenerator, ValueSyntaxCodeGenerator} from "./syntax-code-generator";
import {CodeGenerationContext, CodeGenerationOptions} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {Scope} from "./scope";
import {CompilationContext} from "../compilation-context";

const log = debug("DefaultCodeGenerationContext");

/**
 * Default implementation of the code generation context
 */
export class DefaultCodeGenerationContext implements CodeGenerationContext {
    private fallbackCodeGenerator?: FallbackCodeGenerator;
    private entryFunctions = new Set<string>();

    options: CodeGenerationOptions;
    builder: llvm.IRBuilder;
    scope = new Scope();

    private codeGenerators = new Map<ts.SyntaxKind, SyntaxCodeGenerator<ts.Node>>();

    constructor(public compilationContext: CompilationContext, public module: llvm.Module, options?: CodeGenerationOptions) {
        this.builder = new llvm.IRBuilder(this.compilationContext.llvmContext);
        this.options = Object.assign({}, {
            emitLLVM: true,
            unsafe: true,
            wasmOpt: true
        }, options);
    }

    get program() {
        return this.compilationContext.program;
    }

    get llvmContext() {
        return this.compilationContext.llvmContext;
    }

    get typeChecker() {
        return this.program.getTypeChecker();
    }

    generateVoid(node: ts.Node): void {
        log(`Generate node '${node.getText(node.getSourceFile())}'`);
        this.getCodeGenerator(node).generate(node, this);
        log(`Generated node '${node.getText(node.getSourceFile())}'`);
    }

    generate(node: ts.Node): llvm.Value {
        const codeGenerator = this.getCodeGenerator(node);
        assert((codeGenerator as any).generateValue, `Code Generator ${codeGenerator.constructor.name} for node of kind ${ts.SyntaxKind[node.kind]} is not a ValueSyntaxCodeGenerator`);
        const valueEmitter = codeGenerator as ValueSyntaxCodeGenerator<ts.Node>;

        log(`Generate value for node '${node.getText(node.getSourceFile())}'`);
        const value = valueEmitter.generateValue(node, this);
        log(`Generated value for node '${node.getText(node.getSourceFile())}' is '${value}'`);

        assert(value, `Code Generator ${JSON.stringify(codeGenerator)} returned no value`);
        return value;
    }

    generateChildren(node: ts.Node): void {
        ts.forEachChild(node, child => this.generateVoid(child));
    }

    registerCodeGenerator(codeGenerator: SyntaxCodeGenerator<ts.Node>): void {
        assert(codeGenerator);
        const syntaxKind = codeGenerator.syntaxKind;
        assert(syntaxKind, "Code Generator returned undefined as syntax kind");
        assert(!this.codeGenerators.has(syntaxKind), `An other Code Generator is already registered for the syntax kind ${ts.SyntaxKind[syntaxKind]}`);

        log(`Register Code Generator for syntax kind ${ts.SyntaxKind[syntaxKind]}`);

        this.codeGenerators.set(syntaxKind, codeGenerator);
    }

    setFallbackCodeGenerator(fallbackCodeGenerator?: FallbackCodeGenerator) {
        this.fallbackCodeGenerator = fallbackCodeGenerator;
    }

    addEntryFunction(name: string) {
        assert(name, "Name is required");
        this.entryFunctions.add(name);
    }

    getEntryFunctionNames() {
        return Array.from(this.entryFunctions.values());
    }

    enterChildScope(): Scope {
        this.scope = this.scope.enterChild();
        return this.scope;
    }

    leaveChildScope(): Scope {
        this.scope = this.scope.exitChild();
        return this.scope;
    }

    private getCodeGenerator(node: ts.Node): SyntaxCodeGenerator<ts.Node> | FallbackCodeGenerator {
        const codeGenerator = this.codeGenerators.get(node.kind) || this.fallbackCodeGenerator;

        assert(codeGenerator, `No Code Generator registered for syntax kind ${ts.SyntaxKind[node.kind]} nor is a fallback code generator defined`);
        return codeGenerator!;
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import * as debug from "debug";
import {SyntaxCodeGenerator, ValueSyntaxCodeGenerator} from "./syntax-code-generator";
import {CodeGenerationContext} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {Scope} from "./scope";

const log = debug("DefaultCodeGenerationContext");

/**
 * Default implementation of the code generation context
 */
export class DefaultCodeGenerationContext implements CodeGenerationContext {
    private fallbackCodeGenerator?: FallbackCodeGenerator;

    program: ts.Program;
    llvmContext: llvm.LLVMContext;
    module: llvm.Module;
    builder: llvm.IRBuilder;
    scope = new Scope();

    private codeGenerators = new Map<ts.SyntaxKind, SyntaxCodeGenerator<ts.Node>>();

    constructor(program: ts.Program, context: llvm.LLVMContext, module: llvm.Module) {
        this.program = program;
        this.llvmContext = context;
        this.module = module;
        this.builder = new llvm.IRBuilder(context);
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

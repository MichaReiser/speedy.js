import * as assert from "assert";
import * as debug from "debug";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {toCodeGenerationDiagnostic} from "../code-generation-diagnostic";
import {CompilationContext} from "../compilation-context";
import {CodeGenerationContext} from "./code-generation-context";
import {applyCodeGenerationContextMixin} from "./code-generation-context-mixin";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {Scope} from "./scope";

import {SyntaxCodeGenerator} from "./syntax-code-generator";
import {ClassReference} from "./value/class-reference";
import {Value} from "./value/value";

const log = debug("code-generation/default-code-generation-context");

/**
 * Default implementation of the code generation context
 */
export class DefaultCodeGenerationContext implements CodeGenerationContext {
    builder: llvm.IRBuilder;
    scope: Scope;
    requiresGc = false;

    constructor(public compilationContext: CompilationContext, public module: llvm.Module,
                private rootScope = new Scope(),
                private codeGenerators = new Map<ts.SyntaxKind, SyntaxCodeGenerator<ts.Node, Value | void>>(),
                private entryFunctions = new Set<string>(),
                private fallbackCodeGenerator?: FallbackCodeGenerator) {
        this.builder = new llvm.IRBuilder(this.compilationContext.llvmContext);
        this.scope = rootScope;
    }

    get llvmContext() {
        return this.compilationContext.llvmContext;
    }

    get typeChecker() {
        return this.compilationContext.typeChecker;
    }

    // These functions are implemented in the code generation context mixin
    assignValue: (target: Value, value: Value) => void;
    generateChildren: (node: ts.Node) => void;
    generateValue: (node: ts.Node) => Value;
    value: (value: llvm.Value, type: ts.Type) => Value;
    resolveClass: (type: ts.Type, symbol?: ts.Symbol) => ClassReference | undefined;

    createChildContext(): CodeGenerationContext {
        return new DefaultCodeGenerationContext(
            this.compilationContext,
            this.module,
            this.rootScope,
            this.codeGenerators,
            this.entryFunctions,
            this.fallbackCodeGenerator
        );
    }

    generate(node: ts.Node): void | Value {
        log(`Generate node ${ts.SyntaxKind[node.kind]}`);
        try {
            const codeGenerator = this.getCodeGenerator(node);
            return codeGenerator.generate(node, this);
        } catch (error) {
            throw toCodeGenerationDiagnostic(error, node);
        }
    }

    registerCodeGenerator(codeGenerator: SyntaxCodeGenerator<ts.Node, Value | void>): void {
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

    enterChildScope(fn?: llvm.Function): Scope {
        this.scope = this.scope.enterChild(fn);
        return this.scope;
    }

    leaveChildScope(): Scope {
        const child = this.scope;
        this.scope = this.scope.exitChild();
        return child;
    }

    private getCodeGenerator(node: ts.Node): SyntaxCodeGenerator<ts.Node, Value | void> | FallbackCodeGenerator {
        const codeGenerator = this.codeGenerators.get(node.kind) || this.fallbackCodeGenerator;

        assert(codeGenerator, `No Code Generator registered for syntax kind ${ts.SyntaxKind[node.kind]} nor is a fallback code generator defined`);
        return codeGenerator!;
    }
}

applyCodeGenerationContextMixin(DefaultCodeGenerationContext);

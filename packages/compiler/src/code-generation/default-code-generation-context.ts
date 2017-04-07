import * as assert from "assert";
import * as debug from "debug";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";
import {CodeGenerationContext} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {Scope} from "./scope";

import {SyntaxCodeGenerator} from "./syntax-code-generator";
import {Primitive} from "./value/primitive";
import {ResolvedFunctionReference} from "./value/resolved-function-reference";
import {Value} from "./value/value";
import {SpeedyJSClassReference} from "./value/speedy-js-class-reference";
import {ClassReference} from "./value/class-reference";

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

    createChildContext(): CodeGenerationContext {
        return new DefaultCodeGenerationContext(this.compilationContext, this.module, this.rootScope, this.codeGenerators, this.entryFunctions, this.fallbackCodeGenerator);
    }

    generateValue(node: ts.Node): Value {
        const result = this.generate(node);

        assert(result, `Generator for node of kind ${ts.SyntaxKind[node.kind]} returned no value but caller expected value`);
        return result!;
    }

    generate(node: ts.Node): void | Value {
        log(`Generate node ${ts.SyntaxKind[node.kind]}`);
        const codeGenerator = this.getCodeGenerator(node);
        return codeGenerator.generate(node, this);
    }

    generateChildren(node: ts.Node): void {
        ts.forEachChild(node, child => {
            this.generate(child)
        });
    }

    assignValue(target: Value, value: Value) {
        if (target.isAssignable()) {
            target.generateAssignmentIR(value, this);
        } else {
            throw new Error(`Assignment to readonly value ${target}`);
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

    value(value: llvm.Value, type: ts.Type): Value {
        const symbol = type.getSymbol();

        if (type.flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.NumberLike | ts.TypeFlags.IntLike)) {
            return new Primitive(value, type);
        }

        if (symbol.flags & ts.SymbolFlags.Function) {
            const signatures = this.typeChecker.getSignaturesOfType(type, ts.SignatureKind.Call);
            assert(signatures.length === 1, "No function type found or function is overloaded und should therefore not be dereferenced");

            return ResolvedFunctionReference.createForSignature(value as llvm.Function, signatures[0], this);
        }

        if (symbol.flags & ts.SymbolFlags.Method) {
            // TODO Objekt erstellen und dann methode
            // Requires special return object that contains the method function pointer and as
            // well the object reference ptr
            throw new Error("Returning methods is not yet supported");
        }

        if (type.flags & ts.TypeFlags.Object) {
            const classReference = this.resolveClass(type as ts.ObjectType);
            if (classReference) {
                return classReference.objectFor(value, type as ts.ObjectType, this);
            }
        }

        throw Error(`Unable to convert llvm value of type ${this.typeChecker.typeToString(type)} to Value object.`);
    }

    call(fn: llvm.Function, args: Value[] | llvm.Value[], returnType: ts.Type, name?: string): Value | void {
        const llvmArgs = args.length === 0 || args[0] instanceof llvm.Value ? (args as llvm.Value[]) : (args as Value[]).map(arg => arg.generateIR(this));
        const returnValue = this.builder.createCall(fn, llvmArgs, name);

        if (returnType.flags & ts.TypeFlags.Void) {
            return (void 0);
        }

        return this.value(returnValue, returnType);
    }

    resolveClass(type: ts.ObjectType, symbol = type.getSymbol()): ClassReference | undefined {
        if (this.scope.hasClass(symbol)) {
            return this.scope.getClass(symbol);
        }

        if (symbol.flags & ts.SymbolFlags.Class && this.isClassDefined(type)) {
            const reference = SpeedyJSClassReference.create(type as ts.ObjectType, this);
            this.scope.addClass(symbol, reference);
            return reference;
        }

        return undefined;
    }

    private isClassDefined(type: ts.ObjectType) {
        return type.getProperties().every(property => !!(property.flags & ts.SymbolFlags.Property) ||
            property.getDeclarations() &&
            property.getDeclarations().length > 0 &&
            !!(property.getDeclarations()[0] as ts.MethodDeclaration).body
        );
    }

    private getCodeGenerator(node: ts.Node): SyntaxCodeGenerator<ts.Node, Value | void> | FallbackCodeGenerator {
        const codeGenerator = this.codeGenerators.get(node.kind) || this.fallbackCodeGenerator;

        assert(codeGenerator, `No Code Generator registered for syntax kind ${ts.SyntaxKind[node.kind]} nor is a fallback code generator defined`);
        return codeGenerator!;
    }
}

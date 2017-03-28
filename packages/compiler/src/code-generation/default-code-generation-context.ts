import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import * as debug from "debug";

import {SyntaxCodeGenerator} from "./syntax-code-generator";
import {CodeGenerationContext} from "./code-generation-context";
import {FallbackCodeGenerator} from "./fallback-code-generator";
import {Scope} from "./scope";
import {CompilationContext} from "../compilation-context";
import {Value} from "./value/value";
import {FunctionReference} from "./value/function-reference";
import {ObjectReference} from "./value/object-reference";
import {MethodReference} from "./value/method-reference";
import {Primitive} from "./value/primitive";

const log = debug("code-generation/default-code-generation-context");

/**
 * Default implementation of the code generation context
 */
export class DefaultCodeGenerationContext implements CodeGenerationContext {
    private fallbackCodeGenerator?: FallbackCodeGenerator;
    private entryFunctions = new Set<string>();

    builder: llvm.IRBuilder;
    scope = new Scope();

    private codeGenerators = new Map<ts.SyntaxKind, SyntaxCodeGenerator<ts.Node, Value | void>>();

    constructor(public compilationContext: CompilationContext, public module: llvm.Module) {
        this.builder = new llvm.IRBuilder(this.compilationContext.llvmContext);
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
            target.generateAssignmentIR(value);
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

    enterChildScope(fn?: FunctionReference): Scope {
        this.scope = this.scope.enterChild(fn);
        return this.scope;
    }

    leaveChildScope(): Scope {
        const child = this.scope;
        this.scope = this.scope.exitChild();
        return child;
    }

    functionReference(fn: llvm.Function, returnType: ts.Type): FunctionReference {
        return new FunctionReference(fn, returnType, this);
    }

    methodReference(object: ObjectReference, method: llvm.Function, returnType: ts.Type): MethodReference {
        return new MethodReference(object, method, returnType, this);
    }

    value(value: llvm.Value, type: ts.Type): Value {
        const symbol = type.getSymbol();

        if (type.flags & (ts.TypeFlags.BooleanLike | ts.TypeFlags.NumberLike | ts.TypeFlags.IntLike)) {
            return new Primitive(value, type);
        }

        if (symbol.flags & ts.SymbolFlags.Function) {
            const signatures = this.typeChecker.getSignaturesOfType(type, ts.SignatureKind.Call);
            assert(signatures.length === 0, "Overloaded methods not yet supported");
            return this.functionReference(value as llvm.Function, signatures[0].getReturnType());
        }

        if (symbol.flags & ts.SymbolFlags.Method) {
            // TODO Objekt erstellen und dann methode
            // Requires special return object that contains the method function pointer and as
            // well the object reference ptr
            throw new Error("Returning methods is not yet supported");
        }

        if (type.flags & ts.TypeFlags.Object) {
            const classReference = this.scope.getClass(symbol);
            return classReference.objectFor(value, type as ts.ObjectType);
        }

        throw Error(`Unable to convert llvm value of type ${this.typeChecker.typeToString(type)} to Value object.`);
    }

    private getCodeGenerator(node: ts.Node): SyntaxCodeGenerator<ts.Node, Value | void> | FallbackCodeGenerator {
        const codeGenerator = this.codeGenerators.get(node.kind) || this.fallbackCodeGenerator;

        assert(codeGenerator, `No Code Generator registered for syntax kind ${ts.SyntaxKind[node.kind]} nor is a fallback code generator defined`);
        return codeGenerator!;
    }
}

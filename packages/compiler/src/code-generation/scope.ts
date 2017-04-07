import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {Allocation} from "./value/allocation";
import {ClassReference} from "./value/class-reference";
import {FunctionReference} from "./value/function-reference";

/**
 * The lexical scope
 */
export class Scope {
    private variables = new Map<ts.Symbol, Allocation>();
    private functions = new Map<ts.Symbol, FunctionReference>();
    private classes = new Map<ts.Symbol, ClassReference>();
    private returnAlloca: Allocation | undefined;
    private retBlock: llvm.BasicBlock | undefined;
    private children: Scope[] = [];

    constructor(private parent?: Scope, private fn?: llvm.Function) {}

    /**
     * Stores the function result. Only present in a function that is non void
     */
    get returnAllocation(): Allocation | undefined {
        return this.returnAlloca || (this.parent ? this.parent.returnAllocation : undefined);
    }

    set returnAllocation(allocation: Allocation | undefined) {
        this.returnAlloca = allocation;
    }

    /**
     * Block that is the terminator of a function. All return statements need to jump directly to this return block
     * to ensure that no succeeding statements are executed. Only present inside of a function (also void function, as these might return void);
     */
    get returnBlock(): llvm.BasicBlock | undefined {
        return this.retBlock|| (this.parent ? this.parent.returnBlock: undefined);
    }

    set returnBlock(returnBlock: llvm.BasicBlock | undefined) {
        this.retBlock = returnBlock;
    }

    /**
     * Returns a reference to the function in which this scope is defined
     * @return the function
     */
    get enclosingFunction(): llvm.Function {
        const result = this.fn || (this.parent ? this.parent.enclosingFunction : undefined);
        assert(result, "Code generation always needs to be inside of a function");

        return result!;
    }

    addVariable(symbol: ts.Symbol, value: Allocation): void {
        assert(symbol, "symbol is undefined");
        assert(value, "value is undefined");
        assert(!this.variables.has(symbol), `Variable ${symbol.name} is already defined in scope`);

        this.variables.set(symbol, value);
    }

    getVariable(symbol: ts.Symbol): Allocation {
        assert(symbol, "symbol is undefined");

        const variable = this.variables.get(symbol);
        if (!variable && this.parent) {
            return this.parent.getVariable(symbol);
        }

        assert(variable, `variable ${symbol.name} is not defined in scope`);
        return variable!;
    }

    getNested(symbol: ts.Symbol): Allocation | undefined {
        if (this.hasVariable(symbol)) {
            return this.getVariable(symbol);
        }

        for (const scope of this.children) {
            return scope.getNested(symbol);
        }

        return undefined;
    }

    getVariables(): ts.Symbol[] {
        return Array.from(this.variables.keys());
    }

    getAllVariables(): ts.Symbol[] {
        const childVariables = this.children.map(child => child.getAllVariables());
        return Array.prototype.concat.apply(this.getVariables(), childVariables);
    }

    hasVariable(symbol: ts.Symbol): boolean {
        return this.variables.has(symbol) || (!!this.parent && this.parent.hasVariable(symbol));
    }

    addFunction(symbol: ts.Symbol, fn: FunctionReference): void {
        assert(fn, "function is undefined");
        assert(symbol, "symbol is undefined");
        assert(!this.functions.has(symbol), `function ${symbol.name} is already defined in scope`);

        this.functions.set(symbol, fn);
    }

    getFunction(symbol: ts.Symbol): FunctionReference {
        assert(symbol, "symbol is undefined");

        const fun = this.functions.get(symbol);
        if (!fun && this.parent) {
            return this.parent.getFunction(symbol);
        }

        assert(fun, `function ${symbol.name} is not defined in scope`);
        return fun!;
    }

    addClass(symbol: ts.Symbol, classReference: ClassReference) {
        assert(symbol, "symbol is undefined");
        assert(classReference, "class reference is undefined");
        assert(!this.classes.has(symbol), `class ${symbol.name} is already defined`);

        this.classes.set(symbol, classReference);
    }

    getClass(symbol: ts.Symbol): ClassReference {
        assert(symbol, "symbol is undefined");

        const cls = this.classes.get(symbol);
        if (!cls && this.parent) {
            return this.parent.getClass(symbol);
        }

        assert(cls, `Class ${symbol.name} is not defined in scope`);
        return cls!;
    }

    enterChild(fn?: llvm.Function): Scope {
        const child = new Scope(this, fn);
        this.children.push(child);
        return child;
    }

    exitChild(): Scope {
        assert(this.parent, "Cannot leave root scope");
        return this.parent!;
    }

    hasFunction(symbol: ts.Symbol): boolean {
        return this.functions.has(symbol) || (!!this.parent && this.parent.hasFunction(symbol));
    }

    hasClass(symbol: ts.Symbol): boolean {
        return this.classes.has(symbol) || (!!this.parent && this.parent.hasClass(symbol));
    }
}

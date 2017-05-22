import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {Allocation} from "./value/allocation";
import {ClassReference} from "./value/class-reference";
import {FunctionReference} from "./value/function-reference";
import {Value} from "./value/value";

/**
 * The lexical scope
 */
export class Scope {
    private variables = new Map<ts.Symbol, Value>();
    private functions: Map<ts.Symbol, FunctionReference>;
    private classes: Map<ts.Symbol, ClassReference>;
    private returnAlloca: Allocation | undefined;
    private labels: Map<string | Symbol, llvm.BasicBlock> = new Map();
    private children: Scope[] = [];

    constructor(private parent?: Scope, private fn?: llvm.Function) {
        this.functions = parent ? parent.functions : new Map<ts.Symbol, FunctionReference>();
        this.classes = parent ? parent.classes : new Map<ts.Symbol, ClassReference>();
    }

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
     * Returns the block that is the target of a continue statement
     * @param label the name of the label or undefined for the default continue target
     * @return the basic block that is the target of the continue statement or undefined
     */
    getContinueBlock(label?: string): llvm.BasicBlock | undefined {
        return this.getLabel(typeof(label) === "undefined" ? "continue" : `${label}-continue`);
    }

    /**
     * Sets the target block for the continue statement
     * @param block the target block
     * @param label the name of the label or undefined for the continue statement without a label
     */
    setContinueBlock(block: llvm.BasicBlock, label?: string) {
        this.labels.set(typeof(label) === "undefined" ? "continue" : `${label}-continue`, block);
    }

    /**
     * Returns the block that is the target of a break statement
     * @param label the name of the label or undefined for the default break target
     * @return the basic block that is the target of the break statement or undefined
     */
    getBreakBlock(label?: string): llvm.BasicBlock | undefined {
        return this.getLabel(typeof(label) === "undefined" ? "break" : `${label}-break`);
    }

    /**
     * Sets the target block for the break statement
     * @param block the target block
     * @param label the name of the label or undefined for the break statement without a label
     */
    setBreakBlock(block: llvm.BasicBlock, label?: string) {
        this.labels.set(typeof(label) === "undefined" ? "break" : `${label}-break`, block);
    }

    private getLabel(label: string | Symbol): llvm.BasicBlock | undefined {
        return this.labels.get(label) || (this.parent ? this.parent.getLabel(label) : undefined);
    }

    /**
     * Block that is the terminator of a function. All return statements need to jump directly to this return block
     * to ensure that no succeeding statements are executed. Only present inside of a function (also void function, as these might return void);
     */
    get returnBlock(): llvm.BasicBlock | undefined {
        return this.getLabel("return") || (this.parent ? this.parent.returnBlock : undefined);
    }

    set returnBlock(returnBlock: llvm.BasicBlock | undefined) {
        if (returnBlock) {
            this.labels.set("return", returnBlock);
        } else {
            this.labels.delete("return");
        }
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

    addVariable(symbol: ts.Symbol, value: Value): void {
        assert(symbol, "symbol is undefined");
        assert(value, "value is undefined");
        assert(!this.variables.has(symbol), `Variable ${symbol.name} is already defined in scope`);

        this.variables.set(symbol, value);
    }

    getVariable(symbol: ts.Symbol): Value {
        assert(symbol, "symbol is undefined");

        const variable = this.variables.get(symbol);
        if (!variable && this.parent) {
            return this.parent.getVariable(symbol);
        }

        assert(variable, `variable ${symbol.name} is not defined in scope`);
        return variable!;
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
        return this.functions.has(symbol);
    }

    hasClass(symbol: ts.Symbol): boolean {
        return this.classes.has(symbol);
    }
}

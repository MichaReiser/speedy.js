import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

export class Scope {
    private variables = new Map<ts.Symbol, llvm.AllocaInst>();
    private functions = new Map<ts.Symbol, llvm.Function>();
    private returnAlloca: llvm.AllocaInst | undefined;
    private retBlock: llvm.BasicBlock | undefined;
    private children: Scope[] = [];

    constructor(private parent?: Scope) {}

    /**
     * Stores the function result. Only present in a function that is non void
     */
    get returnAllocation(): llvm.AllocaInst | undefined {
        return this.returnAlloca || (this.parent ? this.parent.returnAllocation : undefined);
    }

    set returnAllocation(allocation: llvm.AllocaInst | undefined) {
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

    addVariable(symbol: ts.Symbol, value: llvm.AllocaInst): void {
        assert(symbol, "symbol is undefined");
        assert(value, "value is undefined");
        assert(!this.variables.has(symbol), `Variable ${symbol.name} is already defined in scope`);

        this.variables.set(symbol, value);
    }

    getVariable(symbol: ts.Symbol): llvm.AllocaInst {
        assert(symbol, "symbol is undefined");

        const variable = this.variables.get(symbol);
        if (!variable && this.parent) {
            return this.parent.getVariable(symbol);
        }

        assert(variable, `variable ${symbol.name} is not defined in scope`);
        return variable!;
    }

    getNested(symbol: ts.Symbol): llvm.AllocaInst {
        const scopes = [this, ...this.children];

        for (const scope of scopes) {
            if (scope.hasVariable(symbol)) {
                return scope.getVariable(symbol);
            }
        }

        assert(false, `Variable with ${symbol.name} is not defined in this or any child scope.`);
        return undefined!;
    }

    getVariables(): ts.Symbol[] {
        return Array.from(this.variables.keys());
    }

    getAllVariables(): ts.Symbol[] {
        const childVariables = this.children.map(child => child.getAllVariables());
        return Array.prototype.concat.apply(this.getVariables(), childVariables);
    }

    hasVariable(symbol: ts.Symbol): boolean {
        return this.variables.has(symbol);
    }

    removeVariable(symbol: ts.Symbol): void {
        assert(symbol, "symbol is undefined");
        this.variables.delete(symbol);
    }

    addFunction(symbol: ts.Symbol, value: llvm.Function): void {
        assert(symbol, "symbol is undefined");
        assert(value, "value is undefined");
        assert(!this.functions.has(symbol), `function ${symbol.name} is already defined in scope`);

        this.functions.set(symbol, value);
    }

    getFunction(symbol: ts.Symbol): llvm.Function {
        assert(symbol, "symbol is undefined");

        const fun = this.functions.get(symbol);
        if (!fun && this.parent) {
            return this.parent.getFunction(symbol);
        }

        assert(fun, `function ${symbol.name} is not defined in scope`);
        return fun!;
    }

    removeFunction(symbol: ts.Symbol): void {
        assert(symbol, "symbol is undefined");
        this.functions.delete(symbol);
    }

    enterChild(): Scope {
        const child = new Scope(this);
        this.children.push(child);
        return child;
    }

    exitChild(): Scope {
        assert(this.parent, "Cannot leave root scope");
        return this.parent!;
    }

    hasFunction(symbol: ts.Symbol) {
        return this.functions.has(symbol);
    }
}

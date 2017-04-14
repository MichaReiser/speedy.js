import * as ts from "typescript";

/**
 * Resolves the symbols of built in Types like Array, string...
 */
export class BuiltInSymbols {
    private constructor(private stdLibSymbols: Map<string, ts.Symbol>) {
    }

    /**
     * Creates a new instance for the given compilation
     * @param program the program to compile
     * @param compilerHost the compiler host the compiler options
     * @return {BuiltInSymbols} the built in symbols
     */
    static create(program: ts.Program, compilerHost: ts.CompilerHost): BuiltInSymbols {
        const symbols = BuiltInSymbols.loadStdLibVariables(program, compilerHost);
        return new BuiltInSymbols(symbols);
    }

    /**
     * Returns the symbol with the given name
     * @param name the name of the desired symbol
     * @return {undefined|ts.Symbol} the symbol with the given name if defined, undefined otherwise
     */
    get(name: string): ts.Symbol | undefined{
        return this.stdLibSymbols.get(name);
    }

    private static loadStdLibVariables(program: ts.Program, compilerHost: ts.CompilerHost): Map<string, ts.Symbol> {
        const defaultLibFileLocation = compilerHost.getDefaultLibLocation!();
        const symbols = new Map<string, ts.Symbol>();
        const stdLibFiles = program.getSourceFiles().filter(file => file.fileName.startsWith(defaultLibFileLocation));

        for (const lib of stdLibFiles) {
            const stdLibVariables = program.getTypeChecker().getSymbolsInScope(lib, ts.SymbolFlags.Variable | ts.SymbolFlags.Interface | ts.SymbolFlags.Function);
            for (const type of stdLibVariables) {
                symbols.set(type.name, type);
            }
        }

        // else, no stdlib included, so no array... etc
        return symbols;
    }
}

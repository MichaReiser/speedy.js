import * as ts from "typescript";

/**
 * Resolves the symbols of built in Types like Array, string...
 */
export class BuiltInSymbols {
    private constructor(private stdLibSymbols: Map<string, ts.Symbol>) {
    }

    static create(program: ts.Program, compilerHost: ts.CompilerHost, compilerOptions: ts.CompilerOptions): BuiltInSymbols {
        const symbols = BuiltInSymbols.loadStdLibVariables(program, compilerHost, compilerOptions);
        return new BuiltInSymbols(symbols);
    }

    get(name: string): ts.Symbol | undefined{
        return this.stdLibSymbols.get(name);
    }

    private static loadStdLibVariables(program: ts.Program, compilerHost: ts.CompilerHost, compilerOptions: ts.CompilerOptions): Map<string, ts.Symbol> {
        const defaultLibFileLocation = compilerHost.getDefaultLibLocation!();
        const symbols = new Map<string, ts.Symbol>();
        const stdLibFiles = program.getSourceFiles().filter(file => file.fileName.startsWith(defaultLibFileLocation));

        for (const lib of stdLibFiles) {
            const stdLibVariables = program.getTypeChecker().getSymbolsInScope(lib, ts.SymbolFlags.Variable);
            for (const type of stdLibVariables) {
                symbols.set(type.name, type);
            }
        }

        // else, no stdlib included, so no array... etc
        return symbols;
    }
}

import * as ts from "typescript";
import {CompilationContext} from "../compilation-context";

/**
 * Resolves the symbols of built in Types like Array, string...
 */
export class BuiltInSymbols {

    private stdLibTypesCache : Map<string, ts.Symbol> | undefined;

    constructor(private compilationContext: CompilationContext) {

    }

    resolve(name: string): ts.Symbol | undefined{
        if (!this.stdLibTypesCache) {
            this.stdLibTypesCache = this.loadStdLibTypes();
        }

        return this.stdLibTypesCache.get(name);
    }

    private loadStdLibTypes(): Map<string, ts.Symbol> {
        const defaultLibFileName = this.compilationContext.compilerHost.getDefaultLibFileName(this.compilationContext.compilerOptions);
        const symbols = new Map<string, ts.Symbol>();

        const stdlib = this.compilationContext.program.getSourceFiles().find(sourceFile => sourceFile.fileName === defaultLibFileName);

        if (stdlib) {
            const stdLibTypes = this.compilationContext.program.getTypeChecker().getSymbolsInScope(stdlib, ts.SymbolFlags.Type);
            for (const type of stdLibTypes) {
                symbols.set(type.name, type);
            }
        }
        // else, no stdlib included, so no array... etc
        return symbols;
    }
}

import {execLLVM} from "./tools";

/**
 * Object files of a single bc file
 */
export interface ObjectFileSymbols {
    /**
     * Symbols used but are not defined inside of this bc file (externally linked)
     */
    readonly undefined: Set<string>;

    /**
     * Common functions
     */
    readonly common: Set<string>;

    /**
     * Symbols defined inside of this bc file
     */
    readonly defined: Set<string>
}

/**
 * Identifies the symbols exported by an LLVM .bc File
 */
export class LLVMByteCodeSymbolsResolver {
    private cache = new Map<string, ObjectFileSymbols>();

    /**
     * Returns the symbols exported by the given file
     * @param objectFile the path to the object file
     * @return the symbols of this object files
     */
    getSymbols(objectFile: string): ObjectFileSymbols {
        let result: ObjectFileSymbols;
        const cached = this.cache.get(objectFile);

        if (cached) {
            result = cached;
        } else {
            result = this.parseSymbolsFromObjectFile(objectFile);
            this.cache.set(objectFile, result);
        }

        return Object.create(result);
    }

    private parseSymbolsFromObjectFile(objectFile: string): ObjectFileSymbols {
        const output = execLLVM("llvm-nm", `"${objectFile}"`);

        const symbols = { undefined: new Set<string>(), common: new Set<string>(), defined: new Set<string>() };
        for (const line of output.split("\n")) {
            if (line.length === 0 || line.indexOf(":") > -1) {
                continue;
            }

            const parts = line.split(" ").filter(part => part.length > 0);
            if (parts.length === 3 && parts[0] === "--------") {
                parts.shift();
            }

            if (parts.length == 2) {
                const [typeCode, symbol] = parts;

                if (typeCode === "U") {
                    symbols.undefined.add(symbol);
                } else if (typeCode === "C") {
                    symbols.common.add(symbol);
                } else if (typeCode === "W" || typeCode === "t" || typeCode === "T" || typeCode === "d" || typeCode === "D") {
                    symbols.defined.add(symbol);
                }
            }
        }

        return symbols;
    }
}


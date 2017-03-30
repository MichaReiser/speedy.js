import {execLLVM} from "./tools";

export interface ObjectFileSymbols {
    readonly undefined: Set<string>;
    readonly common: Set<string>;
    readonly defined: Set<string>
}

export class LLVMByteCodeSymbolsResolver {
    private cache = new Map<string, ObjectFileSymbols>();

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


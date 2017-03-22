import * as ts from "typescript";
import * as debug from "debug";
import {BuiltInObject} from "./built-in-object";
import {BuiltInSymbols} from "./built-in-symbols";
import {CodeGenerationContext} from "../code-generation-context";

const LOG = debug("code-generation/built-ins");

export class BuiltIns {

    private symbolsToObjects: Map<ts.Symbol, BuiltInObject> | undefined;

    constructor(private builtInObjects: BuiltInObject[]) {

    }

    getType(typeSymbol: ts.Symbol): BuiltInObject {
        if (!this.symbolsToObjects) {
            this.symbolsToObjects = this.createSymbolsToObjectsMap();
        }
    }

    private createSymbolsToObjectsMap(context: CodeGenerationContext) {
        const builtInSymbols = new BuiltInSymbols(context);
        const symbolsToObjects = new Map<ts.Symbol, BuiltInObject>();

        for (const builtInObject of this.builtInObjects) {
            const symbol = builtInSymbols.resolve(builtInObject.symbolName);

            if (symbol) {
                LOG(`Register built in object for symbol ${builtInObject.symbolName}`);
                symbolsToObjects.set(symbol, builtInObject);
            } else {
                LOG(`Built in symbol ${builtInObject.symbolName} not found in compilation, is lib.d.ts not included?`);
            }
        }

        return symbolsToObjects;
    }
}

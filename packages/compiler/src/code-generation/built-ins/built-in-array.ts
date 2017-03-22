import {BuiltInObject} from "./built-in-object";

export class ArrayBuiltIn implements BuiltInObject {
    symbolName = "Array";

    supports(symbol: ts.Symbol): boolean {
        return undefined;
    }

    getFunction(symbol: ts.Symbol): llvm.Value {
        return undefined;
    }

    getGetter(property: ts.Symbol): llvm.Function {
        return undefined;
    }

    getSetter(property: ts.Symbol): llvm.Function {
        return undefined;
    }
    constructor() {

    }
}

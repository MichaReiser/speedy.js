import * as ts from "typescript";
import * as llvm from "llvm-node";

export interface BuiltInObject {
    /**
     * The name of this object (e.g. Array)
     */
    symbolName: string;

    /**
     * Tests if the runtime implementation supports the given symbol of this object.
     * @param symbol the symbol that should be supported
     */
    supports(symbol: ts.Symbol): boolean;

    /**
     * Returns the function / method for the given symbol
     * @param symbol the symbol or method to resolve
     */
    getFunction(symbol: ts.Symbol): llvm.Value;

    /**
     * Returns the getter function to retrieve the value of the given property
     * @param property the property
     * @returns the getter function used to retrieve the value
     */
    getGetter(property: ts.Symbol): llvm.Function;

    /**
     * Returns the setter function for the given property
     * @param property the property for which the setter should be resolved
     * @returns the setter
     * @throws if the property is not supported
     */
    getSetter(property: ts.Symbol): llvm.Function;
}

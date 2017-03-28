import * as ts from "typescript";
import {AssignableValue} from "./value";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {FunctionReference} from "./function-reference";

/**
 * Represents an object that is stored at a specific address.
 * Does not represent a specific instance as the object is not destroyed when the
 * address is overridden with a new instance.
 */
export interface ObjectReference extends AssignableValue {

    /**
     * The type of the object, e.g. Array
     */
    type: ts.Type;

    /**
     * Returns the function for the given call expression
     * @param callExpression the function call
     * @returns called function of the call expression
     */
    getFunction(callExpression: ts.CallExpression): FunctionReference;

    /**
     * Returns the given property
     * @param property the property
     * @returns reference to the defined property
     */
    getProperty(property: ts.PropertyAccessExpression): ObjectPropertyReference;

    /**
     * Returns the value of an element
     * @param element the element
     * @returns the value of the element
     */
    getIndexer(element: ts.ElementAccessExpression): ObjectIndexReference;

    /**
     * Destructs the object
     */
    destruct();
}

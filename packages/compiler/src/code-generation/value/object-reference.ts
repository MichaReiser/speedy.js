import * as ts from "typescript";
import {Value} from "./value";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {FunctionReference} from "./function-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {ClassReference} from "./class-reference";

/**
 * Represents an object that is stored at a specific address.
 * Does not represent a specific instance as the object is not destroyed when the
 * address is overridden with a new instance.
 */
export interface ObjectReference extends Value {

    /**
     * The class reference
     */
    clazz: ClassReference;

    /**
     * The (resolved, e.g. generic parameters replaced) type of the object
     */
    type: ts.ObjectType;

    /**
     * Returns the given property
     * @param property the property
     * @returns reference to the defined property
     */
    getProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference;

    /**
     * Returns the value of an element
     * @param element the element
     * @returns the value of the element
     */
    getIndexer(element: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference;

    /**
     * Returns the size needed to store this object
     * @param context the context
     */
    getTypeStoreSize(context: CodeGenerationContext): number;
}

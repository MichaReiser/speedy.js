import * as ts from "typescript";
import {FunctionCallDescription} from "./function-call-description";

/**
 * Name mangler that ensures unique function / class... names
 */
export interface NameMangler {

    /**
     * Returns the mangled function name for the given function call
     * @param functionCallDescriptor
     */
    mangleFunctionName(functionDescription: FunctionCallDescription): string;

    /**
     * Returns the mangled function name for the property access
     * @param property the property to access
     * @param setter indicator if the name for the getter (false) or setter should be returned
     */
    mangleProperty(property: ts.PropertyAccessExpression, setter: boolean): string;

    /**
     * Returns the mangled function name for the object indexer
     * @param element the element access
     * @param setter indicator if the name for the getter (false) or setter should be returned
     */
    mangleIndexer(element: ts.ElementAccessExpression, setter: boolean): string;
}

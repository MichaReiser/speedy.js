import * as ts from "typescript";

export interface Parameter {
    type: ts.Type;
    variadic: boolean;
}

/**
 * Name mangler that ensures unique function / class... names
 */
export interface NameMangler {

    /**
     * Returns the mangled function name for the given function call
     * @param name the name of the function or undefined if it is an anonymous function
     * @param parameters the parameters of the function
     * @param sourceFile the source file, to which the function belongs (needed to avoid naming clashes between different files)
     * @returns the mangled function name for the function call with the specific arguments
     */
    mangleFunctionName(name: string | undefined, parameters: Parameter[], sourceFile?: ts.SourceFile): string;

    /**
     * Returns the mangled name of either a static or instance method of a class.
     * @param clazz the type of the class
     * @param methodName the name of the method
     * @param parameters the parameters of the function
     * @param sourceFile the source file, to which the function belongs (needed to avoid naming clashes between different files)
     * @returns the mangled function name for the function call with the specific arguments
     */
    mangleMethodName(clazz: ts.ObjectType, methodName: string, parameters: Parameter[], sourceFile?: ts.SourceFile): string;

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

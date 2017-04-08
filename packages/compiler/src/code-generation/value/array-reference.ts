import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {ComputedObjectPropertyReferenceBuilder} from "../util/computed-object-property-reference-builder";
import {ObjectIndexReferenceBuilder} from "../util/object-index-reference-builder";
import {getArrayElementType} from "../util/types";
import {ArrayClassReference} from "./array-class-reference";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {UnresolvedMethodReference} from "./unresolved-method-reference";

/**
 * Reference to an Array<T> Object
 */
export class ArrayReference extends BuiltInObjectReference {

    private elementType: ts.Type;

    /**
     * Creates a new instance
     * @param objectAddress the address of the array object
     * @param arrayType the type of the array
     * @param arrayClass the arrayClass
     */
    constructor(objectAddress: llvm.Value, arrayType: ts.ObjectType, arrayClass: ArrayClassReference) {
        super(objectAddress, arrayType, arrayClass);

        this.elementType = getArrayElementType(arrayType);
    }


    protected get typeName(): string {
        return "Array";
    }

    protected createFunctionFor(symbol: ts.Symbol, signatures: ts.Signature[], propertyAccess: ts.PropertyAccessExpression, context: CodeGenerationContext): FunctionReference {
        switch (symbol.name) {
            case "fill":
            case "unshift":
            case "push":
            case "pop":
            case "shift":
            case "slice":
            case "splice":
                return UnresolvedMethodReference.createRuntimeMethod(this, signatures, context);
            default:
                return this.throwUnsupportedBuiltIn(propertyAccess);
        }
    }

    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference {
        switch (symbol.name) {
            case "length":
                return ComputedObjectPropertyReferenceBuilder
                    .forProperty(propertyAccess, context)
                    .fromRuntime()
                    .build(this);

            default:
                return this.throwUnsupportedBuiltIn(propertyAccess);
        }
    }

    public getIndexer(elementAccessExpression: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        return ObjectIndexReferenceBuilder
            .forElement(elementAccessExpression, context)
            .fromRuntime()
            .build(this);
    }
}

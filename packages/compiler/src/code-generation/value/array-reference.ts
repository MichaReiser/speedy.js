import * as llvm from "llvm-node";
import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {getArrayElementType} from "../util/types";
import {ArrayClassReference} from "./array-class-reference";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectIndexReferenceBuilder} from "./object-index-reference-builder";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectPropertyReferenceBuilder} from "./object-property-reference-builder";
import {UnresolvedMethodReference} from "./unresolved-method-reference";

/**
 * Reference to an Array<T> Object
 */
export class ArrayReference extends BuiltInObjectReference {

    private elementType: ts.Type;

    /**
     * Creates a new instance
     * @param objectAddress the address of the array object
     * @param type the array type (instantiated)
     */
    constructor(objectAddress: llvm.Value, type: ts.ObjectType) {
        super(objectAddress, type);

        this.elementType = getArrayElementType(type);
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
                return ObjectPropertyReferenceBuilder
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

    /**
     * Inserts the instruction that releases the memory allocated by the array
     */
    destruct(context: CodeGenerationContext) {
        const nameMangler = new RuntimeSystemNameMangler(context.compilationContext);
        const fnName = nameMangler.mangleMethodName(this.type, "free", []);

        const deleteFunction = context.module.getOrInsertFunction(
            fnName,
            llvm.FunctionType.get(llvm.Type.getVoidTy(context.llvmContext), [ArrayClassReference.getArrayType(context)], false)
        );

        context.builder.createCall(deleteFunction, [this.generateIR()]);
    }
}

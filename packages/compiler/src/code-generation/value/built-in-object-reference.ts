import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {FunctionReference} from "./function-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {Value} from "./value";
import {CodeGenerationError} from "../../code-generation-error";

/**
 * Object reference to a built in object (that is part of the runtime).
 */
export abstract class BuiltInObjectReference implements ObjectReference {
    private properties = new Map<ts.Symbol, ObjectPropertyReference | FunctionReference>();

    /**
     * Creates a new instance for an object that is stored at the specified object address and is of the given type
     * @param objectAddress the address, where the object is stored
     * @param type the type of the object
     */
    constructor(protected objectAddress: llvm.Value, public type: ts.ObjectType) {
        assert(objectAddress.type.isPointerTy(), `Object address needs to be a pointer type`);
    }

    generateIR() {
        return this.objectAddress;
    }

    isObject() {
        return true;
    }

    isAssignable(): true {
        return true;
    }

    dereference() {
        return this;
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext) {
        assert(value.isObject(), "Cannot assign non object to object reference");
        this.objectAddress = value.generateIR(context);
    }

    abstract destruct(context: CodeGenerationContext): void;

    getProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const symbol = context.typeChecker.getSymbolAtLocation(property);
        let propertyReference = this.properties.get(symbol);

        if (propertyReference) {
            return propertyReference;
        }

        if (symbol.flags & ts.SymbolFlags.Method) {
            const type = context.typeChecker.getTypeAtLocation(property);
            const apparentType = context.typeChecker.getApparentType(type);
            const signatures = context.typeChecker.getSignaturesOfType(apparentType, ts.SignatureKind.Call);

            const fn = this.createFunctionFor(symbol, signatures, property, context);
            this.properties.set(symbol, fn);
            return fn;
        }

        propertyReference = this.createPropertyReference(symbol, property, context);
        this.properties.set(symbol, propertyReference);
        return propertyReference;
    }

    getIndexer(element: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        throw this.throwUnsupportedBuiltIn(element);
    }

    /**
     * Throws an exception for a unsupported element access
     */
    protected throwUnsupportedBuiltIn(node: ts.ElementAccessExpression): never;

    /**
     * Throws an exception for an unsupported index accesss
     */
    protected throwUnsupportedBuiltIn(node: ts.PropertyAccessExpression): never;

    protected throwUnsupportedBuiltIn(node: any, symbol?: ts.Symbol): never {
        if (node.kind === ts.SyntaxKind.ElementAccessExpression) {
            throw CodeGenerationError.builtInDoesNotSupportElementAccess(node, this.typeName);
        } else if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
            throw CodeGenerationError.builtInPropertyNotSupported(node, this.typeName);
        } else {
            throw CodeGenerationError.builtInMethodNotSupported(node, this.typeName, symbol!.name);
        }
    }

    /**
     * Returns the name of the built in type as string (e.g. Array)
     */
    protected abstract get typeName(): string;

    /**
     * Creates the function for the given symbol and call
     * @param symbol the symbol of the called function
     * @param signatures the signatures of the method
     * @param propertyAccessExpression the property access
     * @param context the code generation context
     * @return the method to invoke
     * @throws if the built in method is not supported
     */
    protected createFunctionFor(symbol: ts.Symbol, signatures: ts.Signature[], propertyAccessExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): FunctionReference {
        return this.throwUnsupportedBuiltIn(propertyAccessExpression);
    }

    /**
     * Creates a property reference for the property defined by the given symbol
     * @param symbol the symbol of the property
     * @param propertyAccess the property access
     * @param context the code generation context
     * @return a property reference for accessing this property
     * @throws if the property is not supported
     */
    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference {
        return this.throwUnsupportedBuiltIn(propertyAccess);
    }
}

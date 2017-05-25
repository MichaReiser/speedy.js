import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "./address";
import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectReference} from "./object-reference";
import {isMaybeObjectType, toLLVMType} from "../util/types";
import {AddressLValue} from "./address-lvalue";
import {Value} from "./value";

/**
 * Object reference to a built in object (that is part of the runtime).
 */
export abstract class BuiltInObjectReference implements ObjectReference {
    private properties = new Map<ts.Symbol, ObjectPropertyReference | FunctionReference>();

    /**
     * Creates a new instance for an object that is stored at the specified object address and is of the given type
     * @param objectAddress the address, where the object is stored
     * @param type the type of the object
     * @param clazz the class of the object
     */
    constructor(protected objectAddress: Address, public type: ts.ObjectType, public clazz: ClassReference) {
    }

    getTypeStoreSize(context: CodeGenerationContext) {
        return this.clazz.getTypeStoreSize(this.type, context);
    }

    generateIR(context: CodeGenerationContext) {
        return this.objectAddress.get(context);
    }

    isObject() {
        return true;
    }

    isAssignable(): boolean {
        return false;
    }

    dereference() {
        return this;
    }

    castImplicit(type: ts.Type, context: CodeGenerationContext): Value | undefined {
        if (this.type === type || isMaybeObjectType(type) && type.types.indexOf(this.type) !== -1) {
            return this;
        }

        // casting it to undefined. Casts to other types not yet supported
        if (type.flags & ts.TypeFlags.Undefined) {
            const castedPtr = context.builder.createBitCast(this.generateIR(context), toLLVMType(type, context));
            return this.clazz.objectFor(new AddressLValue(castedPtr, type), this.type, context);
        }

        return undefined;
    }

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
            throw CodeGenerationDiagnostic.builtInDoesNotSupportElementAccess(node, this.typeName);
        } else if (node.kind === ts.SyntaxKind.PropertyAccessExpression) {
            throw CodeGenerationDiagnostic.builtInPropertyNotSupported(node, this.typeName);
        } else {
            throw CodeGenerationDiagnostic.builtInMethodNotSupported(node, this.typeName, symbol!.name);
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

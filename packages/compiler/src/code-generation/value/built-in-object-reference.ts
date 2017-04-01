import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";

import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../code-generation-error";
import {ObjectReference} from "./object-reference";
import {FunctionReference} from "./function-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {Value} from "./value";

export abstract class BuiltInObjectReference implements ObjectReference {
    private functions = new Map<ts.Symbol, FunctionReference>();
    private properties = new Map<ts.Symbol, ObjectPropertyReference>();

    constructor(protected objectAddress: llvm.Value, public type: ts.ObjectType, protected context: CodeGenerationContext) {
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

    generateAssignmentIR(value: Value) {
        assert(value.isObject(), "Cannot assign non object to object reference");
        this.objectAddress = value.generateIR();
    }

    abstract destruct(): void;

    getProperty(property: ts.PropertyAccessExpression): ObjectPropertyReference {
        const symbol = this.context.typeChecker.getSymbolAtLocation(property);
        let propertyReference = this.properties.get(symbol);

        if (!propertyReference) {
            propertyReference = this.createPropertyReference(symbol, property);
            this.properties.set(symbol, propertyReference);
        }

        return propertyReference;
    }

    getIndexer(element: ts.ElementAccessExpression): ObjectIndexReference {
        throw this.throwUnsupportedBuiltIn(element);
    }

    getFunction(callExpression: ts.CallExpression): FunctionReference {
        const signature = this.context.typeChecker.getResolvedSignature(callExpression);
        const symbol = this.context.typeChecker.getSymbolAtLocation((signature.declaration as ts.MethodDeclaration).name);

        let fn = this.functions.get(symbol);
        if (!fn) {
            fn = this.createFunctionFor(symbol, callExpression);
            this.functions.set(symbol, fn);
        }

        return fn;
    }

    /**
     * Throws an exception for an unsupported call expression
     */
    protected throwUnsupportedBuiltIn(node: ts.CallExpression, symbol: ts.Symbol): never;

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
     * @param callExpression the call to the function
     * @return the method to invoke
     * @throws if the built in method is not supported
     */
    protected createFunctionFor(symbol: ts.Symbol, callExpression: ts.CallExpression): FunctionReference {
        return this.throwUnsupportedBuiltIn(callExpression, symbol);
    }

    /**
     * Creates a property reference for the property defined by the given symbol
     * @param symbol the symbol of the property
     * @param propertyAccess the property access
     * @return a property reference for accessing this property
     * @throws if the property is not supported
     */
    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression): ObjectPropertyReference {
        return this.throwUnsupportedBuiltIn(propertyAccess);
    }
}

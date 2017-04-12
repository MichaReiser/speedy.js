import * as assert from "assert";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "./address";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectReference} from "./object-reference";
import {SpeedyJSClassReference} from "./speedy-js-class-reference";
import {UnresolvedMethodReference} from "./unresolved-method-reference";
import {AssignableValue, Value} from "./value";
import {Pointer} from "./pointer";

export class SpeedyJSObjectReference implements ObjectReference {

    constructor(private address: Address, public type: ts.ObjectType, public clazz: SpeedyJSClassReference) {
    }

    getTypeStoreSize(context: CodeGenerationContext) {
        return this.clazz.getTypeStoreSize(this.type, context);
    }

    getProperty(property: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference | FunctionReference {
        const symbol = context.typeChecker.getSymbolAtLocation(property);

        if (symbol.flags & ts.SymbolFlags.Property) {
            const type = context.typeChecker.getTypeAtLocation(property);
            return ObjectPropertyReference.createFieldProperty(type, this, symbol);
        }

        // otherwise it is a method
        const type = context.typeChecker.getTypeAtLocation(property);
        const apparentType = context.typeChecker.getApparentType(type);
        const signatures = context.typeChecker.getSignaturesOfType(apparentType, ts.SignatureKind.Call);

        return UnresolvedMethodReference.createMethod(this, signatures, context);
    }

    getIndexer(element: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        throw new Error('Method not implemented.');
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        assert(value.isObject(), "Cannot assign non objects");
        assert(this.address.isPointer(), "Cannot assign to an address");

        (this.address as Pointer).set(value.generateIR(context), context);
    }

    isAssignable(): this is AssignableValue {
        return this.address.isPointer();
    }

    isObject(): this is ObjectReference {
        return true;
    }

    dereference(context: CodeGenerationContext): Value {
        return this;
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.address.get(context);
    }
}

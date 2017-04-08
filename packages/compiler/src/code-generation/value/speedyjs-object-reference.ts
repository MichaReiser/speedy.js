import * as assert from "assert";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReference} from "./function-reference";
import {ObjectIndexReference} from "./object-index-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {ObjectReference} from "./object-reference";
import {SpeedyJSClassReference} from "./speedy-js-class-reference";
import {AssignableValue, Value} from "./value";
import {UnresolvedMethodReference} from "./unresolved-method-reference";

export class SpeedyJSObjectReference implements ObjectReference {

    constructor(private objectAddress: llvm.Value, public type: ts.ObjectType, public clazz: SpeedyJSClassReference) {
        assert(objectAddress.type.isPointerTy(), `Object address needs to be a pointer type`);
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
        context.builder.createStore(value.generateIR(context), this.objectAddress);
    }

    isAssignable(): this is AssignableValue {
        return true;
    }

    isObject(): this is ObjectReference {
        return true;
    }

    dereference(context: CodeGenerationContext): Value {
        return this;
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.objectAddress;
    }
}

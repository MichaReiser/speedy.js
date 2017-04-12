import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value, AssignableValue} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Reference to a specific object index (x[10])
 */
export class ObjectIndexReference implements AssignableValue {

    constructor(public type: ts.Type, private object: ObjectReference, private index: Value, private getter: llvm.Function | undefined, private setter: llvm.Function | undefined) {
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.getValue(context).generateIR(context);
    }

    getValue(context: CodeGenerationContext): Value {
        const call = context.builder.createCall(this.getter!, [this.object.generateIR(context), this.index.generateIR(context)], "[i]")!;
        call.addDereferenceableAttr(1, this.object.getTypeStoreSize(context));

        return context.value(call, this.type);
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        const args = [
            value.generateIR(context),
            this.index.generateIR(context),
            this.object.generateIR(context)
        ].reverse();

        const call = context.builder.createCall(this.setter!, args);

        call.addDereferenceableAttr(1, this.object.getTypeStoreSize(context));
    }

    isAssignable(): true {
        return true;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(context: CodeGenerationContext) {
        return this.getValue(context);
    }
}

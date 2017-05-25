import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {AssignableValue, Value} from "./value";

/**
 * Reference to a specific object index (x[10])
 */
export class ObjectIndexReference implements AssignableValue {

    constructor(public type: ts.Type,
                private object: ObjectReference,
                private index: Value,
                private getter: llvm.Function | undefined,
                private setter: llvm.Function | undefined) {
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return context.builder.createCall(this.getter!, [this.object.generateIR(context), this.index.generateIR(context)], "[i]")!;
    }

    getValue(context: CodeGenerationContext): Value {
        const call = this.generateIR(context);
        return context.value(call, this.type);
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        const valueToSet = value.generateIR(context);
        const objectPtr = this.object.generateIR(context);
        const indexValue = this.index.generateIR(context);

        context.builder.createCall(this.setter!, [objectPtr, indexValue, valueToSet]);
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

    castImplicit(type: ts.Type, context: CodeGenerationContext) {
        return this.dereference(context).castImplicit(type, context);
    }
}

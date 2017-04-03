import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value, AssignableValue} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";

/**
 * Reference to an object property (x.name)
 */
export class ObjectPropertyReference implements AssignableValue {

    constructor(public type: ts.Type, private object: ObjectReference, private getter: llvm.Function | undefined, private setter: llvm.Function | undefined) {
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.getValue(context).generateIR(context);
    }

    getValue(context: CodeGenerationContext): Value {
        return context.call(this.getter!, [this.object], this.type)!;
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        context.call(this.setter!, [this.object, value], this.type);
    }

    isAssignable(): boolean {
        return !!this.setter;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference() {
        return this;
    }
}

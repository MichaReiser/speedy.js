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
        return context.call(this.getter!, [this.object, this.index], this.type)!;
    }

    generateAssignmentIR(value: Value, context: CodeGenerationContext): void {
        context.call(this.setter!, [this.object, this.index, value], this.type);
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

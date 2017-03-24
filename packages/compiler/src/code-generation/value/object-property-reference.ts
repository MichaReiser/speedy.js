import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value, AssignableValue} from "./value";
import {ObjectReference} from "./object-reference";
import {FunctionReference} from "./function-reference";
import {CodeGenerationContext} from "../code-generation-context";

export class ObjectPropertyReference implements AssignableValue {

    constructor(public type: ts.Type, private object: ObjectReference, private getter: llvm.Function | undefined, private setter: llvm.Function | undefined, private context: CodeGenerationContext) {
    }

    generateIR(): llvm.Value {
        return this.getValue().generateIR();
    }

    getValue(): Value {
        return FunctionReference.invoke(this.getter!, [this.object], this.type, this.context);
    }

    generateAssignmentIR(value: Value): void {
        FunctionReference.invoke(this.setter!, [this.object, value], this.type, this.context);
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

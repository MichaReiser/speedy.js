import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value} from "./value";
import {ObjectReference} from "./object-reference";

/**
 * Represents a primitive, stack allocated value.
 */
export class Primitive implements Value {
    constructor(private llvmValue: llvm.Value, public type: ts.Type) {}

    generateIR(): llvm.Value {
        return this.llvmValue;
    }

    isAssignable() {
        return false;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference() {
        return this;
    }
}

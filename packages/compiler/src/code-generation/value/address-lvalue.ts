import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from"typescript";
import {Address} from "./address";

/**
 * An lvalue storing an address
 */
export class AddressLValue implements Address {

    constructor(private lvalue: llvm.Value, public type: ts.Type) {
        assert(lvalue.type.isPointerTy(), "An address value needs to be a pointer type");
    }

    get() {
        return this.lvalue;
    }

    isPointer() {
        return false;
    }
}

import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {isMaybeObjectType} from "../util/types";
import {ObjectReference} from "./object-reference";
import {Primitive} from "./primitive";
import {AssignableValue, Value} from "./value";

/**
 * Represents the undefined value.
 * Is a i8 pointer value by default but can be casted to the target type (supports, boolean, int, number and object)
 */
export class Undefined implements Value {

    static create(context: CodeGenerationContext) {
        return new Undefined(llvm.Constant.getNullValue(llvm.Type.getInt8PtrTy(context.llvmContext)));
    }

    private constructor(private nullPtr: llvm.Value) {
    }

    isAssignable(): this is AssignableValue {
        return false;
    }

    isObject(): this is ObjectReference {
        return false;
    }

    dereference(context: CodeGenerationContext): Value {
        return this;
    }

    generateIR(context: CodeGenerationContext): llvm.Value {
        return this.nullPtr;
    }

    castImplicit(type: ts.Type, context: CodeGenerationContext): Value | any {
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return Primitive.false(context, type);
        }

        if (type.flags & ts.TypeFlags.IntLike) {
            return new Primitive(llvm.ConstantInt.get(context.llvmContext, 0), type);
        }

        if (type.flags & ts.TypeFlags.NumberLike) {
            return new Primitive(llvm.ConstantFP.getNaN(llvm.Type.getDoubleTy(context.llvmContext)), type);
        }

        // cast pointer
        if (type.flags & ts.TypeFlags.Object || isMaybeObjectType(type) || type.flags & ts.TypeFlags.Undefined) {
            return new Undefined(context.builder.createBitCast(this.generateIR(context), context.toLLVMType(type)));
        }

        return undefined;
    }

}

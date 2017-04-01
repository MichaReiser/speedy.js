import * as ts from "typescript";
import * as llvm from "llvm-node";
import {Value} from "./value";
import {ObjectReference} from "./object-reference";
import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReferenceBuilder} from "./function-reference-builder";

/**
 * Represents a primitive, stack allocated value.
 */
export class Primitive implements Value {
    /**
     * Converts the given value to an int32 type
     * @param value the value to convert
     * @param type the type of the value
     * @param int32Type the int 32 type
     * @param context the context
     * @return the converted value
     */
    static toInt32(value: llvm.Value, type: ts.Type, int32Type: ts.Type, context: CodeGenerationContext) {
        if (type.flags & ts.TypeFlags.IntLike) {
            return value;
        }

        if (type.flags & (ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike)) {
            return FunctionReferenceBuilder
                .forFunctionCallDescriptor({
                    functionName: "toInt32",
                    returnType: int32Type,
                    arguments: [{
                        name: "value",
                        type: type,
                        optional: false,
                        variadic: false
                    }]
                }, context)
                .fromRuntime()
                .functionReference()
                .invoke([value])!
                .generateIR();
        }

        throw new Error(`Unsupported conversion of ${context.typeChecker.typeToString(type)} to int32`);
    }

    /**
     * Converts the given value to a boolean
     * @param value the value to convert
     * @param type the type of the value
     * @param context the context
     * @return a boolean value
     */
    static toBoolean(value: llvm.Value, type: ts.Type, context: CodeGenerationContext) {
        if (type.flags & ts.TypeFlags.BooleanLike) {
            return value;
        }

        if (type.flags & ts.TypeFlags.IntLike) {
            return context.builder.createICmpNE(value, llvm.ConstantInt.get(context.llvmContext, 0));
        }

        if (type.flags & ts.TypeFlags.NumberLike) {
            return context.builder.createFCmpONE(value, llvm.ConstantFP.get(context.llvmContext, 0));
        }

        throw new Error(`value of type ${context.typeChecker.typeToString(type)} cannot be converted to bool`);
    }

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

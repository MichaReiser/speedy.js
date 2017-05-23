import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {FunctionDeclarationBuilder} from "../util/function-declaration-builder";
import {ObjectReference} from "./object-reference";
import {Value} from "./value";

/**
 * Represents a primitive, stack allocated value.
 */
export class Primitive implements Value {

    /**
     * Converts the value to an int32 type
     * @param value the value to convert
     * @param valueType the type of the value
     * @param int32Type the int 32 type
     * @param context the context
     * @return the converted value
     * @see https://tc39.github.io/ecma262/#sec-ecmascript-function-objects-call-thisargument-argumentslist
     */
    static toInt32(value: Value, valueType: ts.Type, int32Type: ts.Type, context: CodeGenerationContext) {
        let intValue: llvm.Value;

        if (valueType.flags & ts.TypeFlags.IntLike) {
            intValue = value.generateIR(context);
        } else if (valueType.flags & ts.TypeFlags.BooleanLike) {
            const llvmValue = value.generateIR(context);
            intValue = context.builder.createZExt(llvmValue, llvm.Type.getInt32Ty(context.llvmContext), `${llvmValue.name}AsInt32`);
        } else if (valueType.flags & (ts.TypeFlags.NumberLike)) {
            const llvmValue = value.generateIR(context);
            const fn = FunctionDeclarationBuilder.create("toInt32d", [ { name: "value", type: valueType }], int32Type, context)
                .withAttribute(llvm.Attribute.AttrKind.ReadNone)
                .withAttribute(llvm.Attribute.AttrKind.AlwaysInline)
                .externalLinkage()
                .declareIfNotExisting();
            intValue = context.builder.createCall(fn, [llvmValue], `${llvmValue.name}AsInt32`);
        } else if (valueType.flags & ts.TypeFlags.Object) {
            intValue = llvm.ConstantInt.get(context.llvmContext, 0); // as long as valueOf and toString are not supported
        } else {
            throw new Error(`Unsupported conversion of ${context.typeChecker.typeToString(valueType)} to int32`);
        }

        return new Primitive(intValue, int32Type);
    }

    /**
     * Converts the given value to a boolean
     * @param value the value to convert
     * @param valueType the type of the value
     * @param context the context
     * @return a boolean value
     */
    static toBoolean(value: Value | llvm.Value, valueType: ts.Type, context: CodeGenerationContext) {
        const llvmValue = value instanceof llvm.Value ? value : value.generateIR(context);
        if (valueType.flags & ts.TypeFlags.BooleanLike) {
            return llvmValue;
        }

        if (valueType.flags & ts.TypeFlags.IntLike) {
            return context.builder.createICmpNE(llvmValue, llvm.ConstantInt.get(context.llvmContext, 0), `${llvmValue.name}AsBool`);
        }

        if (valueType.flags & ts.TypeFlags.NumberLike) {
            return context.builder.createFCmpONE(llvmValue, llvm.ConstantFP.get(context.llvmContext, 0), `${llvmValue.name}AsBool`);
        }

        if (valueType.flags & ts.TypeFlags.Object) {
            return context.builder.createICmpNE(llvmValue, llvm.Constant.getNullValue(llvmValue.type), `${llvmValue.name}AsBool`);
        }

        throw new Error(`value of type ${context.typeChecker.typeToString(valueType)} cannot be converted to bool`);
    }

    /**
     * Converts the value to a number
     * @param value the value to convert
     * @param numberType the typescript 'number' type
     * @param context the context
     * @return {Primitive} the value converted to a number
     */
    static toNumber(value: Value, numberType: ts.Type, context: CodeGenerationContext) {
        let numberValue: llvm.Value;
        const llvmValue = value.generateIR(context);
        if (llvmValue.type.isIntegerTy()) {
            numberValue = context.builder.createSIToFP(llvmValue, llvm.Type.getDoubleTy(context.llvmContext), `${llvmValue.name}AsNumber`);
        } else if (llvmValue.type.isDoubleTy()) {
            numberValue = llvmValue;
        } else {
            throw new Error(`value of type ${llvmValue.type} cannot be converted to number`);
        }

        return new Primitive(numberValue, numberType);
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

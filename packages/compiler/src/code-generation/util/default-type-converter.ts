import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";

import {CodeGenerationContext} from "../code-generation-context";
import {ClassReference} from "../value/class-reference";
import {getCallSignature, isFunctionType, isMaybeObjectType} from "./types";
import {TypePlace, TypeScriptToLLVMTypeConverter} from "./typescript-to-llvm-type-converter";

export class DefaultTypeConverter implements TypeScriptToLLVMTypeConverter {

    protected get llvmContext() {
        return this.context.llvmContext;
    }

    constructor(protected context: CodeGenerationContext) {
    }

    convert(type: ts.Type, place: TypePlace): llvm.Type {
        if (type.flags & ts.TypeFlags.Any) {
            return this.getAnyType(place);
        }

        if (type.flags & ts.TypeFlags.IntLike) {
            return this.getIntType(place);
        }

        if (type.flags & ts.TypeFlags.NumberLike) {
            return this.getNumberType(place);
        }

        if (type.flags & ts.TypeFlags.BooleanLike) {
            return this.getBooleanType(place);
        }

        if (type.flags & ts.TypeFlags.Void) {
            return this.getVoidType(place);
        }

        if (type.flags & ts.TypeFlags.Undefined) {
            return this.getUndefinedType(place);
        }

        if (isFunctionType(type)) {
            const callSignature = getCallSignature(type);
            const declaration = callSignature.getDeclaration();
            const parameterTypes = callSignature.getParameters().map((p, i) => {
                return this.convert(this.context.typeChecker.getTypeOfSymbolAtLocation(p, declaration.parameters[i]), place & TypePlace.PARAMETER);
            });

            return llvm.FunctionType.get(this.convert(callSignature.getReturnType(), place & TypePlace.RETURN_VALUE), parameterTypes, false).getPointerTo();
        }

        if (type.flags & ts.TypeFlags.Object) {
            const classReference = this.context.resolveClass(type);
            if (classReference) {
                return this.getObjectType(type as ts.ObjectType, classReference, place);
            }
        }

        if (isMaybeObjectType(type)) {
            return this.convert(type.getNonNullableType(), place);
        }

        return this.throwUnknownConversionError(type);
    }

    protected throwUnknownConversionError(type: ts.Type): never {
        if (type.getSymbol() && type.getSymbol().getDeclarations().length > 0) {
            throw CodeGenerationDiagnostics.unsupportedType(type.getSymbol().getDeclarations()[0], this.context.typeChecker.typeToString(type));
        }

        throw new Error(`Unsupported type ${this.context.typeChecker.typeToString(type)}`);
    }

    protected getAnyType(place: TypePlace): never {
        throw new Error(`Any type not supported, annotate the type`);
    }

    protected getIntType(place: TypePlace) {
        return llvm.Type.getInt32Ty(this.llvmContext);
    }

    protected getBooleanType(place: TypePlace) {
        return llvm.Type.getInt1Ty(this.llvmContext);
    }

    protected getNumberType(place: TypePlace) {
        return llvm.Type.getDoubleTy(this.llvmContext);
    }

    protected getVoidType(place: TypePlace) {
        return llvm.Type.getVoidTy(this.llvmContext);
    }

    protected getUndefinedType(place: TypePlace) {
        return llvm.Type.getInt8PtrTy(this.llvmContext);
    }

    protected getObjectType(objectType: ts.ObjectType, classReference: ClassReference, place: TypePlace): llvm.Type {
        return classReference.getLLVMType(objectType, this.context).getPointerTo();
    }
}

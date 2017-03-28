import * as ts from "typescript";
import * as llvm from "llvm-node";

import {ArrayReference} from "./array-reference";
import {Value} from "./value";
import {CodeGenerationContext} from "../code-generation-context";
import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {FunctionReferenceBuilder} from "./function-reference-builder";

export class ArrayClassReference extends ClassReference {
    private constructor(typeInformation: llvm.GlobalVariable, symbol: ts.Symbol, context: CodeGenerationContext) {
        super(typeInformation, symbol, context);
    }

    static create(symbol: ts.Symbol, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(symbol, context);
        return new ArrayClassReference(typeInformation, symbol, context);
    }

    static getArrayType(context: CodeGenerationContext) {
        return llvm.StructType.get(context.llvmContext, [
            llvm.Type.getInt32Ty(context.llvmContext),
            llvm.Type.getInt32Ty(context.llvmContext),
            llvm.Type.getIntNTy(context.llvmContext, context.module.dataLayout.getPointerSize(0)).getPointerTo()
        ]).getPointerTo();
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType) {
        return new ArrayReference(pointer, type, this.context)
    }

    fromLiteral(type: ts.ObjectType, elements: Value[]): ArrayReference {
        const constructorFn = FunctionReferenceBuilder
            .forFunctionCallDescriptor({
                classType: type, // Array<T>
                functionName: "constructor",
                arguments: [{
                    name: "items",
                    type, // Array<T>
                    variadic: true,
                    optional: false
                }],
                returnType: type // Array<T>
            }, this.context)
            .fromRuntime()
            .functionReference();

        return constructorFn.invoke(elements) as ArrayReference;
    }

    getFields() {
        return [];
    }

    getConstructor(newExpression: ts.NewExpression): FunctionReference {
        return FunctionReferenceBuilder
            .forCall(newExpression, this.context)
            .fromRuntime()
            .functionReference();
    }

    getLLVMType(type: ts.Type): llvm.Type {
        return ArrayClassReference.getArrayType(this.context);
    }
}

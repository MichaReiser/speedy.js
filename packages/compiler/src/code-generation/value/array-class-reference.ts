import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";

import {ArrayReference} from "./array-reference";
import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {createResolvedFunction, createResolvedParameter} from "./resolved-function";
import {ResolvedFunctionReference} from "./resolved-function-reference";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";
import {Value} from "./value";
import {CompilationContext} from "../../compilation-context";
import {getArrayElementType, toLLVMType} from "../util/types";

/**
 * Implements the static methods of the Array<T> class
 */
export class ArrayClassReference extends ClassReference {
    private constructor(typeInformation: llvm.GlobalVariable, symbol: ts.Symbol, compilationContext: CompilationContext) {
        super(typeInformation, symbol, compilationContext);
    }

    static create(symbol: ts.Symbol, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(symbol, context);
        return new ArrayClassReference(typeInformation, symbol, context.compilationContext);
    }

    /**
     * Creates an array instance from an array literal
     * @param type the type of the array
     * @param elements the elements that are to be stored in the created array
     * @param context the code generation context
     * @return {ArrayReference} the created array
     */
    static fromLiteral(type: ts.ObjectType, elements: Value[], context: CodeGenerationContext): ArrayReference {
        const parameters = [ createResolvedParameter("items", type, false, undefined, true) ];
        const resolvedConstructor = createResolvedFunction("constructor", [], parameters, type, type.getSymbol().getDeclarations()[0].getSourceFile(), type);
        const constructorFunction = ResolvedFunctionReference.createRuntimeFunction(resolvedConstructor, context);
        context.requiresGc = true;

        return constructorFunction.invokeWith(elements, context) as ArrayReference;
    }

    static getArrayType(arrayType: ts.Type, context: CodeGenerationContext) {
        const elementType = getArrayElementType(arrayType);
        let llvmElementType: llvm.Type;

        if (elementType.flags & ts.TypeFlags.Object) {
            llvmElementType = llvm.Type.getInt8PtrTy(context.llvmContext);
        } else {
            llvmElementType = toLLVMType(elementType, context);
        }

        return llvm.StructType.get(context.llvmContext, [
            llvm.Type.getInt32Ty(context.llvmContext),
            llvm.Type.getInt32Ty(context.llvmContext),
            llvmElementType.getPointerTo()
        ]);
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType) {
        return new ArrayReference(pointer, type, this)
    }

    getFields() {
        return [];
    }

    getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference {
        const constructorSignature = context.typeChecker.getResolvedSignature(newExpression);
        context.requiresGc = true;

        return UnresolvedFunctionReference.createRuntimeFunction([constructorSignature], context);
    }

    getLLVMType(type: ts.Type, context: CodeGenerationContext): llvm.Type {
        return ArrayClassReference.getArrayType(type, context);
    }
}

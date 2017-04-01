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
     * @param context the code gneeration context
     * @return {ArrayReference} the created array
     */
    static fromLiteral(type: ts.ObjectType, elements: Value[], context: CodeGenerationContext): ArrayReference {
        const parameters = [ createResolvedParameter("items", type, false, undefined, true) ];
        const resolvedConstructor = createResolvedFunction("constructor", [], parameters, type, type.getSymbol().getDeclarations()[0].getSourceFile(), type);
        const constructorFunction = ResolvedFunctionReference.createRuntimeFunction(resolvedConstructor, context);
        return constructorFunction.invokeWith(elements, context) as ArrayReference;
    }

    static getArrayType(context: CodeGenerationContext) {
        return llvm.StructType.get(context.llvmContext, [
            llvm.Type.getInt32Ty(context.llvmContext),
            llvm.Type.getInt32Ty(context.llvmContext),
            llvm.Type.getIntNTy(context.llvmContext, context.module.dataLayout.getPointerSize(0)).getPointerTo()
        ]).getPointerTo();
    }

    objectFor(pointer: llvm.Value, type: ts.ObjectType) {
        return new ArrayReference(pointer, type)
    }

    getFields() {
        return [];
    }

    getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference {
        const constructorSignature = context.typeChecker.getResolvedSignature(newExpression);
        return UnresolvedFunctionReference.createRuntimeFunction([constructorSignature], context);
    }

    getLLVMType(type: ts.Type, context: CodeGenerationContext): llvm.Type {
        return ArrayClassReference.getArrayType(context);
    }
}

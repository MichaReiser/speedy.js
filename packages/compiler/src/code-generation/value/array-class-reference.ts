import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {getArrayElementType, isMaybeObjectType} from "../util/types";
import {TypePlace} from "../util/typescript-to-llvm-type-converter";
import {Address} from "./address";

import {ArrayReference} from "./array-reference";
import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {createResolvedFunction, createResolvedParameter} from "./resolved-function";
import {ResolvedFunctionReference} from "./resolved-function-reference";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";

/**
 * Implements the static methods of the Array<T> class
 */
export class ArrayClassReference extends ClassReference {

    private llvmTypes = new Map<string, llvm.StructType>();

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
    static fromLiteral(type: ts.ObjectType, elements: llvm.Value[], context: CodeGenerationContext): ArrayReference {
        const parameters = [ createResolvedParameter("items", type, false, undefined, true) ];
        const resolvedConstructor = createResolvedFunction("constructor", [], parameters, type, type.getSymbol().getDeclarations()[0].getSourceFile(), type);
        const constructorFunction = ResolvedFunctionReference.createRuntimeFunction(resolvedConstructor, context);
        context.requiresGc = true;

        return constructorFunction.invokeWith(elements, context) as ArrayReference;
    }

    static fromCArray(type: ts.ObjectType, elementsPtr: llvm.Value, length: llvm.Value, context: CodeGenerationContext): ArrayReference {
        const constructorName = new RuntimeSystemNameMangler(context.compilationContext).mangleMethodName(type, "constructor", [{ type, variadic: true }]);

        let constructorFn = context.module.getFunction(constructorName);

        if (!constructorFn) {
            const elementsType = context.toRuntimeLLVMType(getArrayElementType(type), TypePlace.PARAMETER).getPointerTo();
            const constructorType = llvm.FunctionType.get(context.toRuntimeLLVMType(type, TypePlace.RETURN_VALUE), [
                elementsType,
                llvm.Type.getInt32Ty(context.llvmContext)
            ], false);

            constructorFn = llvm.Function.create(constructorType, llvm.LinkageTypes.ExternalLinkage, constructorName, context.module);
            constructorFn.addFnAttr(llvm.Attribute.AttrKind.AlwaysInline);
        }

        const arrayPtr = context.builder.createCall(constructorFn, [elementsPtr, length]);

        context.requiresGc = true;
        return context.value(arrayPtr, type) as ArrayReference;
    }

    objectFor(address: Address, type: ts.ObjectType) {
        return new ArrayReference(address, type, this);
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
        let elementType = getArrayElementType(type);

        if (isMaybeObjectType(elementType)) {
            elementType = elementType.getNonNullableType();
        }

        const elementsPtr = context.toRuntimeLLVMType(elementType, TypePlace.FIELD).getPointerTo();

        const existing = this.llvmTypes.get(elementsPtr.toString());
        if (existing) {
            return existing;
        }

        const forwardDeclaration = llvm.StructType.create(context.llvmContext, "class.Array");
        this.llvmTypes.set(elementsPtr.toString(), forwardDeclaration);

        forwardDeclaration.setBody([
            elementsPtr,
            elementsPtr,
            llvm.Type.getInt32Ty(context.llvmContext)
        ]);

        return forwardDeclaration;
    }
}

import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {Address} from "./address";

import {ClassReference, Field} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {SpeedyJSConstructorFunctionReference} from "./speedyjs-constructor-function-reference";
import {SpeedyJSObjectReference} from "./speedyjs-object-reference";

export class SpeedyJSClassReference extends ClassReference {

    static create(type: ts.ObjectType, context: CodeGenerationContext) {
        const baseTypes = type.getBaseTypes();

        const declaration = type.getSymbol().valueDeclaration as ts.ClassDeclaration;
        if (baseTypes && type.getBaseTypes().length > 0) {
            throw CodeGenerationDiagnostics.unsupportedClassInheritance(declaration);
        }

        if (type.objectFlags & ts.ObjectFlags.Reference) {
            const typeReference = type as ts.TypeReference;
            if (typeReference.typeArguments && typeReference.typeArguments.length > 0) {
                throw CodeGenerationDiagnostics.unsupportedGenericClass(declaration);
            }
        }

        const typeInformation = ClassReference.createTypeDescriptor(type.getSymbol(), context);
        return new SpeedyJSClassReference(typeInformation, type, context.compilationContext);
    }

    private constructor(typeInformation: llvm.GlobalVariable, private objectType: ts.ObjectType, compilationContext: CompilationContext) {
        super(typeInformation, objectType.getSymbol(), compilationContext);
    }

    get type() {
        return this.objectType;
    }

    getFields(type: ts.ObjectType, context: CodeGenerationContext): Field[] {
        const fields = this.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);

        return fields.map(field => {
            return {
                name: field.getName(),
                type: context.typeChecker.getTypeOfSymbolAtLocation(field, field.valueDeclaration!)
            };
        });
    }

    getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference {
        const signature = context.typeChecker.getResolvedSignature(newExpression);
        context.requiresGc = true;
        return SpeedyJSConstructorFunctionReference.create(signature, this, context);
    }

    objectFor(address: Address, type: ts.ObjectType, context: CodeGenerationContext): ObjectReference {
        assert(type.flags & ts.TypeFlags.Object, "Requires an object type");
        return new SpeedyJSObjectReference(address, type, this);
    }
}

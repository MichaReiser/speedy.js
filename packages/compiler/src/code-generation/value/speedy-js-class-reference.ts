import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {toLLVMType} from "../util/types";

import {ClassReference} from "./class-reference";
import {FunctionReference} from "./function-reference";
import {ObjectReference} from "./object-reference";
import {Pointer} from "./pointer";
import {SpeedyJSConstructorFunctionReference} from "./speedyjs-constructor-function-reference";
import {SpeedyJSObjectReference} from "./speedyjs-object-reference";

export class SpeedyJSClassReference extends ClassReference {

    static create(type: ts.ObjectType, context: CodeGenerationContext) {
        const typeInformation = ClassReference.createTypeDescriptor(type.getSymbol(), context);
        return new SpeedyJSClassReference(typeInformation, type, context.compilationContext);
    }

    constructor(typeInformation: llvm.GlobalVariable, private _type: ts.ObjectType, compilationContext: CompilationContext) {
        super(typeInformation, _type.getSymbol(), compilationContext);
    }

    public get type() {
        return this._type;
    }

    protected getFields(type: ts.ObjectType, context: CodeGenerationContext): llvm.Type[] {
        const fields = this.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);

        if (fields.length === 0) {
            // LLVM doesn't seem to like empty structs, at least when marked as dereferencaeble (throws value out of range as size is 0).
            // Therefore, add a boolean fake field. Seems to be the same as clang is doing?!
            // TODO this can be removed when a reference to the type descriptor is added to each object
            return [ llvm.Type.getInt1Ty(context.llvmContext) ];
        }

        return fields.map(field => {
            const type = context.typeChecker.getTypeOfSymbolAtLocation(field, field.valueDeclaration!);
            return toLLVMType(type, context);
        });
    }

    getConstructor(newExpression: ts.NewExpression, context: CodeGenerationContext): FunctionReference {
        const signature = context.typeChecker.getResolvedSignature(newExpression);
        context.requiresGc = true;
        return SpeedyJSConstructorFunctionReference.create(signature, this, context);
    }

    objectFor(pointer: Pointer, type: ts.ObjectType, context: CodeGenerationContext): ObjectReference {
        return new SpeedyJSObjectReference(pointer, type, this);
    }
}

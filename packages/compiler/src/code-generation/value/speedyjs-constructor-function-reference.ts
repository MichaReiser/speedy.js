import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {FunctionDeclarationBuilder} from "../util/function-declaration-builder";
import {FunctionDefinitionBuilder} from "../util/function-definition-builder";
import {sizeof} from "../util/types";
import {TypePlace} from "../util/typescript-to-llvm-type-converter";

import {AbstractFunctionReference} from "./abstract-function-reference";
import {Address} from "./address";
import {AddressLValue} from "./address-lvalue";
import {ObjectReference} from "./object-reference";
import {createResolvedFunction, createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {SpeedyJSClassReference} from "./speedy-js-class-reference";
import {verifyIsSupportedSpeedyJSFunction} from "./speedyjs-function-factory";
import {SpeedyJSObjectReference} from "./speedyjs-object-reference";

export class SpeedyJSConstructorFunctionReference extends AbstractFunctionReference {

    static create(signature: ts.Signature, classReference: SpeedyJSClassReference, context: CodeGenerationContext) {
        let resolvedFunction: ResolvedFunction;

        if (signature.declaration) {
            resolvedFunction = createResolvedFunctionFromSignature(signature, context.compilationContext, classReference.type);
            verifyIsSupportedSpeedyJSFunction(signature.declaration, context);
        } else {
            // default constructor
            const sourceFile = classReference.type.getSymbol().declarations![0].getSourceFile();
            resolvedFunction = createResolvedFunction("constructor", [], [], signature.getReturnType(), sourceFile, classReference.type);
        }

        const declarationContext = context.createChildContext();
        const fn = new ConstructorFunctionBuilder(resolvedFunction, classReference, declarationContext)
            .mangleName()
            .defineIfAbsent();

        return new SpeedyJSConstructorFunctionReference(resolvedFunction, fn);
    }

    constructor(private resolvedFunction: ResolvedFunction, private fn: llvm.Function) {
        super(resolvedFunction.classType);
    }

    protected getResolvedFunction(callerContext: CodeGenerationContext): ResolvedFunction {
        return this.resolvedFunction;
    }

    protected getResolvedFunctionFromSignature(signature: ts.Signature, compilationContext: CompilationContext): ResolvedFunction {
        return signature.declaration ? super.getResolvedFunctionFromSignature(signature, compilationContext) : this.resolvedFunction;
    }

    protected getLLVMFunction(): llvm.Function {
        return this.fn;
    }
}

class ConstructorFunctionBuilder {
    private constructorName = "constructor";

    constructor(private resolvedFunction: ResolvedFunction, private classReference: SpeedyJSClassReference, private context: CodeGenerationContext) {
    }

    mangleName() {
        const nameMangler = new DefaultNameMangler(this.context.compilationContext);
        const argumentTypes = this.resolvedFunction.parameters;
        this.constructorName = nameMangler.mangleMethodName(this.classReference.type, this.constructorName, argumentTypes, this.resolvedFunction.sourceFile);
        return this;
    }

    defineIfAbsent(): llvm.Function {
        const existingFn = this.context.module.getFunction(this.constructorName);
        if (existingFn) {
            return existingFn;
        }

        return this.define();
    }

    private define() {
        const declaration = FunctionDeclarationBuilder
            .forResolvedFunction(this.resolvedFunction, this.context)
            .linkOnceOdrLinkage()
            .name(this.constructorName)
            .declare();

        const entryBlock = llvm.BasicBlock.create(this.context.llvmContext, "entry", declaration);
        this.context.builder.setInsertionPoint(entryBlock);

        const objectAddress = this.allocateObjectOnHeap();
        const objectReference = new SpeedyJSObjectReference(objectAddress, this.classReference.type, this.classReference);

        this.context.enterChildScope(declaration);
        this.context.scope.addVariable(this.classReference.symbol, objectReference);

        this.initializeFields(objectAddress);
        this.callUserConstructorFn(declaration, objectReference);

        this.context.leaveChildScope();

        return declaration;
    }

    private allocateObjectOnHeap() {
        const objectType = this.classReference.getLLVMType(this.classReference.type, this.context);
        const pointerType = llvm.Type.getInt8PtrTy(this.context.llvmContext);
        const mallocFunctionType = llvm.FunctionType.get(pointerType, [llvm.Type.getInt32Ty(this.context.llvmContext)], false);
        const malloc = this.context.module.getOrInsertFunction("malloc", mallocFunctionType);
        const size = sizeof(objectType, this.context);

        const result = this.context.builder.createCall(malloc, [size], "thisVoid*");
        const ptr = this.context.builder.createBitCast(result, objectType.getPointerTo(), "this");
        return new AddressLValue(ptr, this.classReference.type);
    }

    private initializeFields(objectAddress: Address) {
        const fields = this.classReference.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);

        for (const field of fields) {
            const declaration = field.valueDeclaration as ts.PropertyDeclaration;

            let value: llvm.Value;
            if (declaration.initializer) {
                value = this.context.generateValue(declaration.initializer).generateIR(this.context);
            } else if (this.context.compilationContext.compilerOptions.unsafe) {
                continue;
            } else {
                const fieldType = this.context.typeChecker.getTypeAtLocation(declaration);
                value = llvm.Constant.getNullValue(this.context.toLLVMType(fieldType, TypePlace.FIELD));
            }

            const fieldOffset = llvm.ConstantInt.get(this.context.llvmContext, this.classReference.getFieldOffset(field));
            const gepFieldIndex = [ llvm.ConstantInt.get(this.context.llvmContext, 0), fieldOffset];
            const fieldPointer = this.context.builder.createInBoundsGEP(objectAddress.get(this.context), gepFieldIndex, `&${field.name}`);
            this.context.builder.createStore(value, fieldPointer, false);
        }
    }

    private callUserConstructorFn(fn: llvm.Function, objectReference: ObjectReference) {
        if (!this.resolvedFunction.definition) {
            this.context.builder.createRet(objectReference.generateIR(this.context));
            return;
        }

        FunctionDefinitionBuilder.create(fn, this.resolvedFunction, this.context)
            .returnValue(objectReference)
            .self(objectReference)
            .define();
    }
}

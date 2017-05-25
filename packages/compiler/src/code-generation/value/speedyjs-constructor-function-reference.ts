import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {FunctionDeclarationBuilder} from "../util/function-declaration-builder";
import {FunctionDefinitionBuilder} from "../util/function-definition-builder";
import {sizeof, toLLVMType} from "../util/types";

import {AbstractFunctionReference} from "./abstract-function-reference";
import {Address} from "./address";
import {AddressLValue} from "./address-lvalue";
import {ObjectReference} from "./object-reference";
import {createResolvedFunction, createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {SpeedyJSClassReference} from "./speedy-js-class-reference";
import {SpeedyJSObjectReference} from "./speedyjs-object-reference";
import {verifyIsSupportedSpeedyJSFunction} from "./speedyjs-function-factory";

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
    private _name: string;

    constructor(private resolvedFunction: ResolvedFunction, private classReference: SpeedyJSClassReference, private context: CodeGenerationContext) {
        this._name = resolvedFunction.functionName;
    }

    mangleName() {
        const argumentTypes = this.resolvedFunction.parameters.map(parameter => parameter.type);
        this._name = new DefaultNameMangler(this.context.compilationContext).mangleMethodName(this.classReference.type, this._name, argumentTypes, this.resolvedFunction.sourceFile);
        return this;
    }

    defineIfAbsent(): llvm.Function {
        const existingFn = this.context.module.getFunction(this._name);
        if (existingFn) {
            return existingFn;
        }

        return this.define();
    }

    private define() {
        const declaration = FunctionDeclarationBuilder
            .forResolvedFunction(this.resolvedFunction, this.context)
            .linkOnceOdrLinkage()
            .name(this._name)
            .declare();

        const entryBlock = llvm.BasicBlock.create(this.context.llvmContext, "entry", declaration);
        this.context.builder.setInsertionPoint(entryBlock);

        const objectAddress = this.allocateObjectOnHeap();
        const objectReference = new SpeedyJSObjectReference(objectAddress, this.classReference.type, this.classReference);

        this.context.enterChildScope();
        this.context.scope.addVariable(this.classReference.symbol, objectReference);

        this.initializeFields(objectAddress);
        this.callUserConstructorFn(declaration, objectReference);

        this.context.leaveChildScope();

        return declaration;
    }

    private allocateObjectOnHeap() {
        const objectType = this.classReference.getLLVMType(this.classReference.type, this.context);
        const pointerType = llvm.Type.getInt8PtrTy(this.context.llvmContext);
        const malloc = this.context.module.getOrInsertFunction("malloc", llvm.FunctionType.get(pointerType, [llvm.Type.getInt32Ty(this.context.llvmContext)], false));
        const size = sizeof(objectType, this.context);

        const result = this.context.builder.createCall(malloc, [size], "thisVoid*");
        const ptr = this.context.builder.createBitCast(result, objectType.getPointerTo(), "this");
        return new AddressLValue(ptr, this.classReference.type);
    }

    private initializeFields(objectAddress: Address) {
        const fields = this.classReference.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);
        for (let i = 0; i < fields.length; ++i) {
            const field = fields[i];
            const declaration = field.valueDeclaration as ts.PropertyDeclaration;

            let value: llvm.Value;
            if (declaration.initializer) {
                value = this.context.generateValue(declaration.initializer).generateIR(this.context);
            } else if (this.context.compilationContext.compilerOptions.unsafe) {
                continue;
            } else {
                value = llvm.Constant.getNullValue(toLLVMType(this.context.typeChecker.getTypeAtLocation(declaration), this.context));
            }

            const fieldOffset = llvm.ConstantInt.get(this.context.llvmContext, this.classReference.getFieldOffset(field));
            const fieldPointer = this.context.builder.createInBoundsGEP(objectAddress.get(this.context), [ llvm.ConstantInt.get(this.context.llvmContext, 0), fieldOffset], `&${field.name}`);
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

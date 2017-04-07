import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CompilationContext} from "../../compilation-context";
import {CodeGenerationContext} from "../code-generation-context";
import {DefaultNameMangler} from "../default-name-mangler";
import {FunctionDeclarationBuilder} from "../util/function-declaration-builder";
import {FunctionDefinitionBuilder} from "../util/function-definition-builder";
import {sizeof, toLLVMType} from "../util/types";

import {AbstractFunctionReference} from "./abstract-function-reference";
import {ClassReference} from "./class-reference";
import {createResolvedFunction, createResolvedFunctionFromSignature, ResolvedFunction} from "./resolved-function";
import {Value} from "./value";

export class SpeedyJSConstructorFunctionReference extends AbstractFunctionReference {

    static create(signature: ts.Signature, classReference: ClassReference, context: CodeGenerationContext) {
        let resolvedFunction: ResolvedFunction;

        if (signature.declaration) {
            resolvedFunction = createResolvedFunctionFromSignature(signature, context.compilationContext, classReference.type);
        } else {
            resolvedFunction = createResolvedFunction("constructor", [], [], signature.getReturnType(), undefined, classReference.type); // TODO find source file?
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

    protected getLLVMFunction(resolvedFunction: ResolvedFunction, context: CodeGenerationContext, passedArguments?: Value[]): llvm.Function {
        return this.fn;
    }
}

class ConstructorFunctionBuilder {
    private _name: string;

    constructor(private resolvedFunction: ResolvedFunction, private classReference: ClassReference, private context: CodeGenerationContext) {
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
            .name(this._name)
            .declare();

        const entryBlock = llvm.BasicBlock.create(this.context.llvmContext, "entry", declaration);
        this.context.builder.setInsertionPoint(entryBlock);

        const objectType = this.classReference.getLLVMType(this.classReference.type, this.context);
        const allocation = this.allocateObjectOnHeap(objectType);
        // TODO add this this.context.scope.addVariable(this)
        this.initializeFields(allocation, objectType);
        this.callUserConstructorFn(declaration);
        this.context.builder.createRet(allocation);

        return declaration;
    }

    private allocateObjectOnHeap(objectType: llvm.Type) {
        const pointerType = llvm.Type.getIntNTy(this.context.llvmContext, this.context.module.dataLayout.getPointerSize(0)).getPointerTo();
        const malloc = this.context.module.getOrInsertFunction("malloc", llvm.FunctionType.get(pointerType, [llvm.Type.getInt32Ty(this.context.llvmContext)], false));

        const result = this.context.builder.createCall(malloc, [sizeof(objectType, this.context)], "this");
        return this.context.builder.createBitCast(result, objectType, "object");
    }

    private initializeFields(objectAddress: llvm.Value, objectType: llvm.Type) {
        const fields = this.classReference.type.getApparentProperties().filter(property => property.flags & ts.SymbolFlags.Property);
        for (let i = 0; i < fields.length; ++i) {
            const field = fields[i];
            const declaration = field.valueDeclaration as ts.PropertyDeclaration;

            let value;
            if (declaration.initializer) {
                value = this.context.generateValue(declaration.initializer).generateIR(this.context);
            } else {
                value = llvm.Constant.getNullValue(toLLVMType(this.context.typeChecker.getTypeAtLocation(declaration), this.context));
            }

            const fieldOffset = llvm.ConstantInt.get(this.context.llvmContext, this.classReference.getFieldsOffset() + i);
            const fieldPointer = this.context.builder.createInBoundsGEP(objectAddress, [ llvm.ConstantInt.get(this.context.llvmContext, 0), fieldOffset], field.name);
            this.context.builder.createStore(value, fieldPointer, false);
        }
    }

    private callUserConstructorFn(fn: llvm.Function) {
        if (!this.resolvedFunction.declaration) {
            return;
        }

        FunctionDefinitionBuilder.create(fn, this.resolvedFunction, this.context)
            .omitEntryBlock()
            .define(this.resolvedFunction.declaration as ts.MethodDeclaration);
    }
}

import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as assert from "assert";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "./object-reference";
import {NameMangler} from "../name-mangler";
import {FunctionReference} from "./function-reference";
import {RuntimeSystemNameMangler} from "../runtime-system-name-mangler";
import {llvmArrayValue} from "../util/llvm-array-helpers";
import {toLLVMType} from "../util/type-mapping";
import {MethodReference} from "./method-reference";
import {createFunctionDescriptorForCall, FunctionCallDescription} from "../function-call-description";
import {ArrayReference} from "./array-reference";
import {DefaultNameMangler} from "../default-name-mangler";
import {ArrayClassReference} from "./array-class-reference";

export class FunctionReferenceBuilder {

    private isRuntimeFunction = false;

    static forCall(callExpression: ts.CallExpression | ts.NewExpression, context: CodeGenerationContext) {
        const descriptor = createFunctionDescriptorForCall(callExpression, context.typeChecker);

        return new FunctionReferenceBuilder(descriptor, context);
    }

    static forFunctionCallDescriptor(callDescriptor: FunctionCallDescription, context: CodeGenerationContext) {
        return new FunctionReferenceBuilder(callDescriptor, context);
    }

    private constructor(private functionCallDescription: FunctionCallDescription, private context: CodeGenerationContext) {
    }

    methodReference(objectReference: ObjectReference) {
        return this.getFactory().createFunction(this.functionCallDescription, objectReference);
    }

    functionReference() {
        return this.getFactory().createFunction(this.functionCallDescription);
    }

    fromRuntime() {
        this.isRuntimeFunction = true;
        return this;
    }

    speedyJSFunction() {
        this.isRuntimeFunction = false;
        return this;
    }

    private getFactory() {
        return this.isRuntimeFunction ? new RuntimeFunctionReferenceFactory(this.context) : new DefaultFunctionReferenceFactory(this.context);
    }
}

interface VarArgs {
    length: llvm.Value;
    values: llvm.Value[];
    elementType: ts.Type;
    parameterName: string;
}

abstract class BaseFunctionReferenceFactory {

    constructor(protected context: CodeGenerationContext, private nameMangler: NameMangler) {}

    createFunction(functionCallDescription: FunctionCallDescription): FunctionReference;
    createFunction(functionCallDescription: FunctionCallDescription, objectReference: ObjectReference): MethodReference;

    createFunction(functionCallDescription: FunctionCallDescription, objectReference?: ObjectReference): MethodReference | FunctionReference {
        const mangledName = this.getMangledName(functionCallDescription);

        let fn = this.context.module.getFunction(mangledName);

        if (!fn) {
            const functionType = this.getFunctionType(functionCallDescription, objectReference);
            fn = llvm.Function.create(functionType, llvm.LinkageTypes.ExternalLinkage, mangledName, this.context.module);
        }

        const getCallArgs = (args) => this.getCallArguments(args, functionCallDescription);
        if (objectReference) {
            return new class extends MethodReference {
                getCallArguments(args: llvm.Value[]) {
                    return getCallArgs(args);
                }
            }(objectReference, fn, functionCallDescription.returnType, this.context);
        }

        return new class extends FunctionReference {
            getCallArguments(args: llvm.Value[]) {
                return getCallArgs(args);
            }
        }(fn, functionCallDescription.returnType, this.context);
    }

    protected getMangledName(functionCallDescription: FunctionCallDescription): string {
        return this.nameMangler.mangleFunctionName(functionCallDescription);
    }

    protected getFunctionType(functionCallDescription: FunctionCallDescription, objectReference?: ObjectReference): llvm.FunctionType {
        let argumentTypes = objectReference ? [toLLVMType(objectReference.type, this.context)] : [];

        for (const argument of functionCallDescription.arguments) {
            if (argument.variadic) {
                const elementType = (argument.type as ts.GenericType).typeArguments[0];
                argumentTypes.push(...this.getVarArgArgumentTypes(elementType));
                break;
            } else {
                argumentTypes.push(toLLVMType(argument.type, this.context));
            }
        }

        return llvm.FunctionType.get(toLLVMType(functionCallDescription.returnType, this.context), argumentTypes, false);
    }

    protected getCallArguments(args: llvm.Value[], functionCallDescription: FunctionCallDescription) {
        let result: llvm.Value[] = [];

        for (let i = 0; i < functionCallDescription.arguments.length; ++i) {
            const argument = functionCallDescription.arguments[i];
            let arg: llvm.Value | undefined;

            if (args.length > i) {
                arg = args[i];
            } else if (argument.initializer) {
                arg = this.context.generateValue(argument.initializer).generateIR();
            } else if (!argument.variadic) {
                assert(false, `Missing value for not optional parameter ${argument.name}`);
                break;
            }

            if (argument.variadic) {
                const arrayType = (argument.type as ts.GenericType);
                const elementType = ArrayReference.getElementType(arrayType);
                const varArgs = {
                    length: llvm.ConstantInt.get(this.context.llvmContext, args.length - i),
                    elementType,
                    parameterName: argument.name,
                    values: args.slice(i),
                };
                result.push(...this.getVarArgArgumentValues(varArgs));

                break;
            } else {
                result.push(arg!);
            }
        }

        return result;
    }

    protected abstract getVarArgArgumentTypes(elementType: ts.Type): llvm.Type[];

    protected abstract getVarArgArgumentValues(varArgs: VarArgs): llvm.Value[];
}

class RuntimeFunctionReferenceFactory extends BaseFunctionReferenceFactory {
    constructor(context: CodeGenerationContext) {
        super(context, new RuntimeSystemNameMangler(context.compilationContext));
    }

    protected getVarArgArgumentTypes(elementType: ts.Type): llvm.Type[] {
        return [toLLVMType(elementType, this.context).getPointerTo(), llvm.Type.getInt32Ty(this.context.llvmContext)];
    }

    protected getVarArgArgumentValues(varArgs: VarArgs) {
        return [
            llvmArrayValue(varArgs.values, toLLVMType(varArgs.elementType, this.context), this.context, varArgs.parameterName),
            varArgs.length
        ];
    }
}

class DefaultFunctionReferenceFactory extends BaseFunctionReferenceFactory {

    constructor(context: CodeGenerationContext) {
        super(context, new DefaultNameMangler(context.compilationContext));
    }

    protected getVarArgArgumentTypes(elementType: ts.Type): llvm.Type[] {
        return [ArrayClassReference.getArrayType(this.context)];
    }

    protected getVarArgArgumentValues(varArgs: VarArgs): llvm.Value[] {
        throw new Error(`Variadic Arguments not yet supported`);
    }

}

import * as assert from "assert";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {NameMangler} from "../name-mangler";
import {toLLVMType} from "../util/types";
import {ObjectReference} from "./object-reference";
import {ResolvedFunction} from "./resolved-function";

export interface FunctionProperties {
    linkage: llvm.LinkageTypes;
    readonly: boolean;
    readnone: boolean;
    alwaysInline: boolean;
    noInline: boolean;
    noUnwind: boolean;
    visibility: llvm.VisibilityTypes;
}

/**
 * Factory for creating the declarations of llvm functions
 */
export class FunctionFactory {

    /**
     * Creates a new instance that uses the given name mangler
     * @param nameMangler the name mangler to use
     */
    constructor(private nameMangler: NameMangler) {
    }

    /**
     * Creates the declaration (and if needed the definition) for the given resolved function called with the specified number of arguments
     * @param resolvedFunction the function to call (specific function, not overload)
     * @param numberOfArguments the number of arguments passed to the function (to know where optional arguments are unset)
     * @param context the code generation context
     * @param properties properties of the function to create, e.g. is the function readonly, what is the linkage
     * @return {Function} the existing function instance or the newly declared function
     */
    getOrCreate(resolvedFunction: ResolvedFunction,
                numberOfArguments: number,
                context: CodeGenerationContext,
                properties?: Partial<FunctionProperties>): llvm.Function {
        return this.getOrCreateStaticOrInstanceFunction(resolvedFunction, numberOfArguments, context, this.getInitializedProperties(properties));
    }

    /**
     * Creates the declaration (and if needed the definition) for the given resolved function called with the specified number of arguments.
     * The declared function is a instance method that needs to be called with the object instance as first argument
     * @param objectReference the object to which the method belongs
     * @param resolvedFunction the resolved function (not overloaded)
     * @param numberOfArguments the number of arguments passed to the function
     * @param context the code generation context
     * @param properties properties of the function to create, e.g. is the function readonly, what is the linkage
     * @return {Function} the existing or newly declared function
     */
    getOrCreateInstanceMethod(objectReference: ObjectReference,
                              resolvedFunction: ResolvedFunction,
                              numberOfArguments: number,
                              context: CodeGenerationContext,
                              properties?: Partial<FunctionProperties>) {
        assert(resolvedFunction.instanceMethod && resolvedFunction.classType, "Resolved function needs to be an instance method");

        return this.getOrCreateStaticOrInstanceFunction(
            resolvedFunction,
            numberOfArguments,
            context,
            this.getInitializedProperties(properties),
            objectReference
        );
    }

    private getInitializedProperties(properties?: Partial<FunctionProperties>): FunctionProperties {
        return Object.assign({}, this.getDefaultFunctionProperties(), properties);
    }

    protected getDefaultFunctionProperties(): FunctionProperties {
        return {
            linkage: llvm.LinkageTypes.LinkOnceODRLinkage,
            readonly: false,
            readnone: false,
            alwaysInline: false,
            noInline: false,
            noUnwind: false,
            visibility: llvm.VisibilityTypes.Default
        };
    }

    private getOrCreateStaticOrInstanceFunction(resolvedFunction: ResolvedFunction,
                                                numberOfArguments: number,
                                                context: CodeGenerationContext,
                                                properties: FunctionProperties,
                                                objectReference?: ObjectReference) {
        const mangledName = this.getMangledFunctionName(resolvedFunction, numberOfArguments);
        let fn = context.module.getFunction(mangledName);

        if (!fn) {
            fn = this.createFunction(mangledName, resolvedFunction, numberOfArguments, context, properties, objectReference);
        }

        return fn;
    }

    protected createFunction(mangledName: string,
                             resolvedFunction: ResolvedFunction,
                             numberOfArguments: number,
                             context: CodeGenerationContext,
                             properties: FunctionProperties,
                             objectReference?: ObjectReference) {
        const llvmArgumentTypes = toLlvmArgumentTypes(resolvedFunction, numberOfArguments, context, objectReference);
        const functionType = llvm.FunctionType.get(toLLVMType(resolvedFunction.returnType, context), llvmArgumentTypes, false);
        const fn = llvm.Function.create(functionType, properties.linkage, mangledName, context.module);
        fn.visibility = properties.visibility;

        for (const attribute of this.getFunctionAttributes(properties)) {
            fn.addFnAttr(attribute);
        }

        this.attributeParameters(fn, resolvedFunction, context, objectReference);

        if (resolvedFunction.returnType.flags & ts.TypeFlags.Object) {
            const classReference = context.resolveClass(resolvedFunction.returnType)!;
            // If object can be undefined, or null
            fn.addDereferenceableAttr(0, classReference.getTypeStoreSize(resolvedFunction.returnType as ts.ObjectType, context));
        }

        return fn;
    }

    private getFunctionAttributes(properties: FunctionProperties) {
        const attributes = [];

        if (properties.noUnwind) {
            attributes.push(llvm.Attribute.AttrKind.NoUnwind);
        }

        if (properties.alwaysInline) {
            attributes.push(llvm.Attribute.AttrKind.AlwaysInline);
        }

        if (properties.noInline) {
            attributes.push(llvm.Attribute.AttrKind.NoInline);
        }

        if (properties.readonly) {
            attributes.push(llvm.Attribute.AttrKind.ReadOnly);
        }

        if (properties.readnone) {
            attributes.push(llvm.Attribute.AttrKind.ReadNone);
        }

        return attributes;
    }

    private attributeParameters(fn: llvm.Function, resolvedFunction: ResolvedFunction, context: CodeGenerationContext, object?: ObjectReference) {
        const parameters = fn.getArguments();
        let argumentOffset = 0;

        if (object) {
            const self = parameters[0];
            self.addAttr(llvm.Attribute.AttrKind.ReadOnly);
            self.addDereferenceableAttr(object.getTypeStoreSize(context));
            argumentOffset = 1;
        }

        for (let i = argumentOffset; i < parameters.length; ++i) {
            const parameter = parameters[i];
            const parameterDefinition = resolvedFunction.parameters[i - argumentOffset];

            if (parameterDefinition.variadic) {
                break;
            }

            if (parameterDefinition.type.flags & ts.TypeFlags.Object) {
                const classReference = context.resolveClass(parameterDefinition.type as ts.ObjectType);

                if (classReference) {
                    parameter.addDereferenceableAttr(classReference.getTypeStoreSize(parameterDefinition.type as ts.ObjectType, context));
                }
            }
        }
    }

    private getMangledFunctionName(resolvedFunction: ResolvedFunction, numberOfArguments: number) {
        const typesOfUsedParameters: ts.Type[] = [];

        for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
            const parameter = resolvedFunction.parameters[i];

            if (parameter.optional && !parameter.initializer && numberOfArguments <= i) {
                break; // Optional parameter that is not set. Therefore, this parameter is not actually used
            }
            typesOfUsedParameters.push(parameter.type);
        }

        return this.mangleFunctionName(resolvedFunction, typesOfUsedParameters);
    }

    protected mangleFunctionName(resolvedFunction: ResolvedFunction, typesOfUsedParameters: ts.Type[]) {
        if (resolvedFunction.classType) {
            return this.nameMangler.mangleMethodName(
                resolvedFunction.classType,
                resolvedFunction.functionName!,
                typesOfUsedParameters,
                resolvedFunction.sourceFile
            );
        }

        return this.nameMangler.mangleFunctionName(resolvedFunction.functionName, typesOfUsedParameters, resolvedFunction.sourceFile);
    }
}

function toLlvmArgumentTypes(resolvedFunction: ResolvedFunction, numberOfArguments: number, context: CodeGenerationContext, objectReference?: ObjectReference) {
    const argumentTypes = objectReference ? [toLLVMType(objectReference.type, context) ] : [];

    for (let i = 0; i < resolvedFunction.parameters.length; ++i) {
        const parameter = resolvedFunction.parameters[i];

        if (parameter.variadic) {
            const elementType = (parameter.type as ts.GenericType).typeArguments[0];
            argumentTypes.push(toLLVMType(elementType, context).getPointerTo(), llvm.Type.getInt32Ty(context.llvmContext));
            break;
        } else if (parameter.optional && !parameter.initializer && numberOfArguments <= i) {
            // optional argument that is not set, skip
            break;
        } else {
            argumentTypes.push(toLLVMType(parameter.type, context));
        }
    }

    return argumentTypes;
}

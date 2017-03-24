import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../code-generation-exception";
import {FunctionReference} from "./function-reference";
import {BuiltInObjectReference} from "./built-in-object-reference";

/**
 * Wrapper for the built in Math object
 */
export class MathObjectReference extends BuiltInObjectReference {

    typeName = "Math";

    constructor(objAddr: llvm.Value, type: ts.Type, context: CodeGenerationContext) {
        super(objAddr, type, context);
    }

    protected createFunctionFor(symbol: ts.Symbol, callExpression: ts.CallLikeExpression) {
        const signature = this.context.typeChecker.getResolvedSignature(callExpression);
        switch (symbol.name) {
            case "sqrt":
                return this.sqrt(signature);
            default:
                throw CodeGenerationError.builtInMethodNotSupported(callExpression, "Math", symbol.name);
        }
    }

    destruct() {
        // no need for free, is a static references
    }

    private sqrt(signature: ts.Signature): FunctionReference {
        const fn = this.context.module.getOrInsertFunction(
                "llvm.sqrt.f64",
                llvm.FunctionType.get(llvm.Type.getDoubleTy(this.context.llvmContext), [llvm.Type.getDoubleTy(this.context.llvmContext)], false)
            ) as llvm.Function;

        class SqrtFunction extends FunctionReference {
            constructor(context: CodeGenerationContext) {
                super(fn, signature, context);
            }

            getCallArguments(args: llvm.Value[]) {
                if (args[0].type.isIntegerTy()) {
                    return [this.context.builder.createSIToFP(args[0], llvm.Type.getDoubleTy(this.context.llvmContext))];
                }

                return args;
            }
        }

        return new SqrtFunction(this.context);
    }
}

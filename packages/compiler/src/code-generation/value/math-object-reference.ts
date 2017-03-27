import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../code-generation-exception";
import {FunctionReference} from "./function-reference";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {toLLVMType} from "../util/type-mapping";

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

    /**
     * Calls the pow function
     * @param lhs the left hand side value (base)
     * @param rhs the right hand side value (exponent)
     * @param type the type of the left and right hand side
     * @param context the context
     * @return the result of the pow operation
     */
    static pow(lhs: llvm.Value, rhs: llvm.Value, type: ts.Type, context: CodeGenerationContext) {
        const powFn = this.getPowFunction(type, context);
        const powArgs = this.getPowCallArguments(lhs, rhs, type, context);
        const result = context.builder.createCall(powFn, powArgs);

        if (type.flags & ts.TypeFlags.IntLike) {
            return context.builder.createFPToSI(result, toLLVMType(type, context));
        }

        return result;
    }

    private static getPowFunction(type: ts.Type, context: CodeGenerationContext) {
        let intrinsicName: string;
        let lhsType: llvm.Type;
        if (type.flags & ts.TypeFlags.IntLike) {
            intrinsicName = "llvm.powi.f32";
            lhsType = llvm.Type.getFloatTy(context.llvmContext);
        } else {
            intrinsicName = "llvm.pow.f64";
            lhsType = llvm.Type.getDoubleTy(context.llvmContext);
        }

        return context.module.getOrInsertFunction(
            intrinsicName,
            llvm.FunctionType.get(lhsType, [lhsType, toLLVMType(type, context)], false)
        );
    }

    private static getPowCallArguments(lhs: llvm.Value, rhs: llvm.Value, type: ts.Type, context: CodeGenerationContext) {
        if (type.flags & ts.TypeFlags.IntLike) {
            lhs = context.builder.createSIToFP(lhs, llvm.Type.getFloatTy(context.llvmContext));
        }

        return [lhs, rhs];
    }
}

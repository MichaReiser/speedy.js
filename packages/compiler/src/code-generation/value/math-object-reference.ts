import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerationError} from "../../code-generation-error";
import {toLLVMType} from "../util/types";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";

/**
 * Wrapper for the built in Math object
 */
export class MathObjectReference extends BuiltInObjectReference {

    typeName = "Math";

    constructor(objAddr: llvm.Value, type: ts.ObjectType) {
        super(objAddr, type);
    }

    protected createFunctionFor(symbol: ts.Symbol, signatures: ts.Signature[], propertyAccessExpression: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        switch (symbol.name) {
            case "sqrt":
                return UnresolvedFunctionReference.createRuntimeFunction(signatures, context, this.type);
            default:
                throw CodeGenerationError.builtInMethodNotSupported(propertyAccessExpression, "Math", symbol.name);
        }
    }

    destruct() {
        // no need for free, is a static references
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

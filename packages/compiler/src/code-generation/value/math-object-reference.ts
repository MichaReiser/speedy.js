import * as llvm from "llvm-node";
import * as ts from "typescript";
import {CodeGenerationError} from "../../code-generation-error";
import {CodeGenerationContext} from "../code-generation-context";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {Primitive} from "./primitive";
import {createResolvedFunction, createResolvedParameter} from "./resolved-function";
import {ResolvedFunctionReference} from "./resolved-function-reference";
import {UnresolvedFunctionReference} from "./unresolved-function-reference";
import {Value} from "./value";

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
            case "pow":
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
     * @param numberType the type of the pow result
     * @param context the context
     * @return the result of the pow operation
     */
    static pow(lhs: Value, rhs: Value, numberType: ts.Type, context: CodeGenerationContext) {
        const mathSymbol = context.compilationContext.builtIns.get("Math");
        const mathObject = context.scope.getVariable(mathSymbol!);
        const mathType = mathObject.type as ts.ObjectType;

        const parameters = [createResolvedParameter("value", numberType), createResolvedParameter("exp", numberType)];
        const resolvedFunction = createResolvedFunction("pow", [], parameters, numberType, undefined, mathType);
        const powFunction = ResolvedFunctionReference.createRuntimeFunction(resolvedFunction, context);

        const args = [Primitive.toNumber(lhs, numberType, context), Primitive.toNumber(rhs, numberType, context)];
        return powFunction.invokeWith(args, context) as Primitive;
    }
}

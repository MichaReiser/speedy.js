import * as assert from "assert";
import * as ts from "typescript";
import {CodeGenerationError} from "../../code-generation-error";
import {CodeGenerationContext} from "../code-generation-context";
import {ComputedObjectPropertyReferenceBuilder} from "../util/computed-object-property-reference-builder";
import {Allocation} from "./allocation";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {MathClassReference} from "./math-class-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {Pointer} from "./pointer";
import {Primitive} from "./primitive";
import {
    createResolvedFunction,
    createResolvedFunctionFromSignature,
    createResolvedParameter
} from "./resolved-function";
import {ResolvedFunctionReference} from "./resolved-function-reference";
import {Value} from "./value";

/**
 * Wrapper for the built in Math object
 */
export class MathObjectReference extends BuiltInObjectReference {

    typeName = "Math";

    constructor(pointer: Pointer, mathType: ts.ObjectType, mathClass: MathClassReference) {
        super(pointer, mathType, mathClass);
    }

    /**
     * Benchmarking results
     * 	pow		sqrt
     * number	int	number	int
     * Chrome	102000	107000	96000	108000	std::pow
     *          98500	104000	95000	113000
     *          96680	109468	98720	109782
     *          98162	107086	106243	113927
     * Firefox	26613	26847	28151	28998
     *          27080	28267	29207	28136
     *          29638	25345	28852	28235
     *          26202	29408	28944	27776
     * Chrome	98312	107155			llvm.pow.f64
     *          99762	108859
     *
     * Maybe using Math.pow and sqrt from the browser directly?
     */
    protected createFunctionFor(symbol: ts.Symbol, signatures: ts.Signature[], propertyAccessExpression: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        switch (symbol.name) {
            case "pow":
            case "sqrt":
            case "log":
            case "sin":
            case "cos":
                assert(signatures.length === 1, "Math functions have not to be overloaded");
                const resolvedFunction = createResolvedFunctionFromSignature(signatures[0], context.compilationContext, this.type);
                resolvedFunction.instanceMethod = false; // they are not really instance methods as this does not have to be passed
                return ResolvedFunctionReference.createRuntimeFunction(resolvedFunction, context, { readnone: true, noUnwind: true });
            default:
                throw CodeGenerationError.builtInMethodNotSupported(propertyAccessExpression, "Math", symbol.name);
        }
    }

    protected createPropertyReference(symbol: ts.Symbol, propertyAccess: ts.PropertyAccessExpression, context: CodeGenerationContext): ObjectPropertyReference {
        switch (symbol.name) {
            case "PI":
                return ComputedObjectPropertyReferenceBuilder
                    .forProperty(propertyAccess, context)
                    .readonly()
                    .fromRuntime()
                    .build(this);

            default:
                return this.throwUnsupportedBuiltIn(propertyAccess);
        }
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
        const mathType = (mathObject as Allocation).type as ts.ObjectType;

        const parameters = [createResolvedParameter("value", numberType), createResolvedParameter("exp", numberType)];
        const resolvedFunction = createResolvedFunction("pow", [], parameters, numberType, undefined, mathType);
        const powFunction = ResolvedFunctionReference.createRuntimeFunction(resolvedFunction, context, { readnone: true, noUnwind: true });

        const args = [Primitive.toNumber(lhs, numberType, context).generateIR(), Primitive.toNumber(rhs, numberType, context).generateIR()];
        return powFunction.invokeWith(args, context)!;
    }
}

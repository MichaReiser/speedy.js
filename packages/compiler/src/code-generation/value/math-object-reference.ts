import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {ComputedObjectPropertyReferenceBuilder} from "../util/computed-object-property-reference-builder";
import {BuiltInObjectReference} from "./built-in-object-reference";
import {MathClassReference} from "./math-class-reference";
import {ObjectPropertyReference} from "./object-property-reference";
import {Pointer} from "./pointer";
import {Primitive} from "./primitive";
import {Value} from "./value";
import {UnresolvedMethodReference} from "./unresolved-method-reference";

/**
 * Wrapper for the built in Math object
 */
export class MathObjectReference extends BuiltInObjectReference {

    typeName = "Math";

    constructor(pointer: Pointer, mathType: ts.ObjectType, mathClass: MathClassReference) {
        super(pointer, mathType, mathClass);
    }

    protected createFunctionFor(symbol: ts.Symbol, signatures: ts.Signature[], propertyAccessExpression: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        switch (symbol.name) {
            // use the llvm intrinsic whenever a web assembly instruction exists
            case "pow":
            case "sqrt":
            case "log":
            case "sin":
            case "cos":
            case "max":
                return UnresolvedMethodReference.createRuntimeMethod(this, signatures, context, { readnone: true, noUnwind: true });
            default:
                throw CodeGenerationDiagnostic.builtInMethodNotSupported(propertyAccessExpression, "Math", symbol.name);
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
        const mathSymbol = context.compilationContext.builtIns.get("Math")!;
        const mathAllocation = context.scope.getVariable(mathSymbol!);
        const mathObject = mathAllocation.dereference(context) as MathObjectReference;

        const powSymbol = mathObject.type.getProperty("pow");
        const powSignature = context.typeChecker.getSignatureFromDeclaration(powSymbol.valueDeclaration as ts.FunctionDeclaration);
        const method = UnresolvedMethodReference.createRuntimeMethod(mathObject, [powSignature], context, { readnone: true, noUnwind: true });

        const args = [Primitive.toNumber(lhs, numberType, context).generateIR(), Primitive.toNumber(rhs, numberType, context).generateIR()];
        return method.invokeWith(args, context) as Value;
    }
}

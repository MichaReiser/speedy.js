import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";
import {CodeGenerationError} from "../../code-generation-error";

class AsExpressionCodeGenerator implements SyntaxCodeGenerator<ts.AsExpression, Value | void> {
    syntaxKind = ts.SyntaxKind.AsExpression;

    generate(node: ts.AsExpression, context: CodeGenerationContext): Value | void {
        const value = context.generateValue(node.expression);
        const sourceType = context.typeChecker.getTypeAtLocation(node.expression);
        const targetType = context.typeChecker.getTypeAtLocation(node);

        let castedValue: Value;
        if (targetType.flags & ts.TypeFlags.BooleanLike) {
            castedValue = new Primitive(Primitive.toBoolean(value, sourceType, context), targetType);
        } else if (targetType.flags & ts.TypeFlags.IntLike) {
            castedValue = Primitive.toInt32(value, sourceType, targetType, context);
        } else if (targetType.flags & ts.TypeFlags.NumberLike) {
            castedValue = Primitive.toNumber(value, targetType, context);
        } else {
            throw CodeGenerationError.unsupportedCast(node, context.typeChecker.typeToString(sourceType), context.typeChecker.typeToString(targetType));
        }

        return castedValue;
    }
}

export default AsExpressionCodeGenerator;

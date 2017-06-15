import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";
import {Value} from "../value/value";

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
            castedValue = Primitive.toNumber(value, sourceType, targetType, context);
        } else {
            throw CodeGenerationDiagnostics.unsupportedCast(node, context.typeChecker.typeToString(sourceType), context.typeChecker.typeToString(targetType));
        }

        return castedValue;
    }
}

export default AsExpressionCodeGenerator;

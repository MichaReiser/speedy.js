import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGeneratorHelper} from "../util/array-code-generator-helper";

class PropertyAccessExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.PropertyAccessExpression> {
    syntaxKind = ts.SyntaxKind.PropertyAccessExpression;

    generateValue(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext): llvm.Value {
        if (ArrayCodeGeneratorHelper.isArrayNode(propertyExpression.expression, context)) {
            return this.generateArrayPropertyAccess(propertyExpression, context);
        }

        throw new Error("Property Access Expression not yet supported");
    }

    generate(node: ts.PropertyAccessExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }

    private generateArrayPropertyAccess(propertyExpression: ts.PropertyAccessExpression, context: CodeGenerationContext) {
        const arrayCodeGeneratorHelper = new ArrayCodeGeneratorHelper(context);
        const elementType = arrayCodeGeneratorHelper.getElementType(propertyExpression.expression);

        const array = context.generate(propertyExpression.expression);

        if (propertyExpression.name.text === "length") {
            return arrayCodeGeneratorHelper.getLength(array, elementType);
        }

        throw new Error(`Unsupported Array method ${propertyExpression.name.text}`);
    }
}

export default PropertyAccessExpressionCodeGenerator;

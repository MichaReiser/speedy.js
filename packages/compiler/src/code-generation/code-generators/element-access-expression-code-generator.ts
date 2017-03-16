import * as ts from "typescript";
import * as llvm from "llvm-node";
import {ValueSyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ArrayCodeGenerator} from "../util/array-code-generator";

/**
 * Element Access Code Generator, eg. array[index]
 */
class ElementAccessExpressionCodeGenerator implements ValueSyntaxCodeGenerator<ts.ElementAccessExpression> {
    syntaxKind = ts.SyntaxKind.ElementAccessExpression;

    generateValue(node: ts.ElementAccessExpression, context: CodeGenerationContext): llvm.Value {
        const arrayCodeGeneratorHelper = ArrayCodeGenerator.create(node.expression, context);

        const array = context.generate(node.expression);
        // const array = context.scope.getVariable(context.typeChecker.getSymbolAtLocation(node.expression)); // FIXME fails with properties
        const index = context.generate(node.argumentExpression!); // TODO: What if absent? when is this the case???

        return arrayCodeGeneratorHelper.getElement(array, index);
    }

    generate(node: ts.ElementAccessExpression, context: CodeGenerationContext): void {
        this.generateValue(node, context);
    }
}

export default ElementAccessExpressionCodeGenerator;

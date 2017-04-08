import * as ts from "typescript";
import {CodeGenerationError} from "../../code-generation-error";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {ObjectIndexReference} from "../value/object-index-reference";

/**
 * Element Access Code Generator, eg. array[index]
 */
class ElementAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ElementAccessExpression, ObjectIndexReference> {
    syntaxKind = ts.SyntaxKind.ElementAccessExpression;

    generate(node: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        const value = context.generateValue(node.expression).dereference(context);

        if (value.isObject()) {
            return value.getIndexer(node, context);
        }

        throw CodeGenerationError.unsupportedIndexer(node);
    }
}

export default ElementAccessExpressionCodeGenerator;

import * as ts from "typescript";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {ObjectReference} from "../value/object-reference";
import {ObjectIndexReference} from "../value/object-index-reference";

/**
 * Element Access Code Generator, eg. array[index]
 */
class ElementAccessExpressionCodeGenerator implements SyntaxCodeGenerator<ts.ElementAccessExpression, ObjectIndexReference> {
    syntaxKind = ts.SyntaxKind.ElementAccessExpression;

    generate(node: ts.ElementAccessExpression, context: CodeGenerationContext): ObjectIndexReference {
        const object = context.generateValue(node.expression).dereference(context) as ObjectReference;
        return object.getIndexer(node, context);
    }
}

export default ElementAccessExpressionCodeGenerator;

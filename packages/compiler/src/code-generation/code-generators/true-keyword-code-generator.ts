import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class TrueKeywordCodeGenerator implements SyntaxCodeGenerator<ts.BooleanLiteral, Primitive> {
    syntaxKind = ts.SyntaxKind.TrueKeyword;

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): Primitive {
        return Primitive.true(context, context.typeChecker.getTypeAtLocation(node));
    }
}

export default TrueKeywordCodeGenerator;

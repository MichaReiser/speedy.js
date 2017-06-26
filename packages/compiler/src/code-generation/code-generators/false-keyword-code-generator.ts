import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";

class FalseKeywordCodeGenerator implements SyntaxCodeGenerator<ts.BooleanLiteral, Primitive> {
    syntaxKind = ts.SyntaxKind.FalseKeyword;

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): Primitive {
        return Primitive.false(context, context.typeChecker.getTypeAtLocation(node));
    }

}

export default FalseKeywordCodeGenerator;

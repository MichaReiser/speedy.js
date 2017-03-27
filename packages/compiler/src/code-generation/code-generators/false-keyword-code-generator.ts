import * as ts from "typescript";
import * as llvm from "llvm-node";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";

class FalseKeywordCodeGenerator implements SyntaxCodeGenerator<ts.BooleanLiteral, Primitive> {
    syntaxKind = ts.SyntaxKind.FalseKeyword;

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): Primitive {
        const value = llvm.ConstantInt.getFalse(context.llvmContext);
        return new Primitive(value, context.typeChecker.getTypeAtLocation(node));
    }

}

export default FalseKeywordCodeGenerator;

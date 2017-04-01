import * as ts from "typescript";
import * as llvm from "llvm-node";
import {CodeGenerationContext} from "../code-generation-context";
import {Primitive} from "../value/primitive";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class TrueKeywordCodeGenerator implements SyntaxCodeGenerator<ts.BooleanLiteral, Primitive> {
    syntaxKind = ts.SyntaxKind.TrueKeyword;

    generate(node: ts.BooleanLiteral, context: CodeGenerationContext): Primitive {
        const trueValue = llvm.ConstantInt.getTrue(context.llvmContext);
        return new Primitive(trueValue, context.typeChecker.getTypeAtLocation(node));
    }
}

export default TrueKeywordCodeGenerator;


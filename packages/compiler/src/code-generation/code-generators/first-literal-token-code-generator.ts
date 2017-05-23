import * as ts from "typescript";
import * as llvm from "llvm-node";

import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Primitive} from "../value/primitive";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

class FirstLiteralTokenCodeGenerator implements SyntaxCodeGenerator<ts.LiteralExpression, Primitive> {
    syntaxKind = ts.SyntaxKind.FirstLiteralToken;

    generate(node: ts.LiteralExpression, context: CodeGenerationContext): Primitive {
        const type = context.typeChecker.getTypeAtLocation(node);
        let value: llvm.Value;

        if (type.flags & ts.TypeFlags.IntLiteral) {
            value = llvm.ConstantInt.get(context.llvmContext, +node.text);
        } else if (type.flags & ts.TypeFlags.NumberLiteral) {
            value = llvm.ConstantFP.get(context.llvmContext, +node.text);
        } else {
            throw CodeGenerationDiagnostic.unsupportedLiteralType(node, context.typeChecker.typeToString(type));
        }

        return new Primitive(value, type);
    }
}

export default FirstLiteralTokenCodeGenerator;

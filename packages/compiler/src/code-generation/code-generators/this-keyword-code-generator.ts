import * as ts from "typescript";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {Value} from "../value/value";

class ThisKeywordCodeGenerator implements SyntaxCodeGenerator<ts.Token<ts.SyntaxKind.ThisKeyword>, Value> {
    syntaxKind = ts.SyntaxKind.ThisKeyword;

    generate(node: ts.Token<ts.SyntaxKind.ThisKeyword>, context: CodeGenerationContext): Value {
        const symbol = context.typeChecker.getSymbolAtLocation(node);
        return context.scope.getVariable(symbol);
    }
}

export default ThisKeywordCodeGenerator;

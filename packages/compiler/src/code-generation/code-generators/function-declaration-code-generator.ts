import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {FunctionReference} from "../value/function-reference";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {FunctionBuilder} from "../util/function-builder";

class FunctionDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.FunctionDeclaration, FunctionReference> {
    syntaxKind = ts.SyntaxKind.FunctionDeclaration;

    generate(functionDeclaration: ts.FunctionDeclaration, context: CodeGenerationContext): FunctionReference {
        const signature = context.typeChecker.getSignatureFromDeclaration(functionDeclaration);

        return FunctionBuilder
            .forSignature(signature, context)
            .internalLinkage()
            .generate(functionDeclaration);
    }
}

export default FunctionDeclarationCodeGenerator;

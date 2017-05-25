import * as ts from "typescript";

import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {UnresolvedFunctionReference} from "../value/unresolved-function-reference";

/**
 * Code Generator for a function declaration
 */
class FunctionDeclarationCodeGenerator implements SyntaxCodeGenerator<ts.FunctionDeclaration, void> {
    syntaxKind = ts.SyntaxKind.FunctionDeclaration;

    generate(functionDeclaration: ts.FunctionDeclaration, context: CodeGenerationContext): void {
        const symbol = context.typeChecker.getSymbolAtLocation(functionDeclaration.name!);

        const type = context.typeChecker.getTypeAtLocation(functionDeclaration);
        const apparentType = context.typeChecker.getApparentType(type);
        const callSignatures = context.typeChecker.getSignaturesOfType(apparentType, ts.SignatureKind.Call);

        const functionReference = UnresolvedFunctionReference.createFunction(callSignatures, context);
        context.scope.addFunction(symbol, functionReference);
    }
}

export default FunctionDeclarationCodeGenerator;

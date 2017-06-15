import * as assert from "assert";
import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../../code-generation-diagnostic";
import {TypeChecker} from "../../type-checker";
import {CodeGenerationContext} from "../code-generation-context";
import {SyntaxCodeGenerator} from "../syntax-code-generator";

class ReturnStatementCodeGenerator implements SyntaxCodeGenerator<ts.ReturnStatement, void> {
    syntaxKind = ts.SyntaxKind.ReturnStatement;

    generate(returnStatement: ts.ReturnStatement, context: CodeGenerationContext): void {
        const returnAllocation = context.scope.returnAllocation;
        const returnBlock = context.scope.returnBlock;

        if (returnStatement.expression) {
            assert(returnAllocation, "No return allocation present but return statement is");
            const returnType = getExpectedReturnType(returnStatement, context.typeChecker);
            const expressionType = context.typeChecker.getTypeAtLocation(returnStatement.expression);

            const returnValue = context.generateValue(returnStatement.expression);
            const casted = returnValue.castImplicit(returnType, context);

            if (!casted) {
                throw CodeGenerationDiagnostics.unsupportedImplicitCastOfReturnValue(
                    returnStatement,
                    context.typeChecker.typeToString(returnType),
                    context.typeChecker.typeToString(expressionType)
                );
            }

            returnAllocation!.generateAssignmentIR(casted, context);
        }

        assert(returnBlock, "No return block present (not inside of a function?)");
        context.builder.createBr(returnBlock!);
    }
}

function getExpectedReturnType(node: ts.ReturnStatement, typeChecker: TypeChecker) {
    function findEnclosingFunction(current: ts.Node): ts.FunctionLikeDeclaration {
        // tslint:disable-next-line:max-line-length
        if (current.kind === ts.SyntaxKind.FunctionExpression || current.kind === ts.SyntaxKind.FunctionDeclaration || current.kind === ts.SyntaxKind.ArrowFunction || current.kind === ts.SyntaxKind.MethodDeclaration) {
            return current as ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration | ts.MethodDeclaration;
        }

        assert(current.parent, "Node is not inside of a function");

        return findEnclosingFunction(current.parent!);
    }

    const fun = findEnclosingFunction(node);

    const signature = typeChecker.getSignatureFromDeclaration(fun);
    return signature.getReturnType();

}

export default ReturnStatementCodeGenerator;

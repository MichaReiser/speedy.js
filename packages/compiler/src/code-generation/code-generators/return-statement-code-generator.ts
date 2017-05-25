import * as ts from "typescript";
import * as assert from "assert";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";
import {TypeChecker} from "../../type-checker";
import {CodeGenerationDiagnostic} from "../../code-generation-diagnostic";

class ReturnStatementCodeGenerator implements SyntaxCodeGenerator<ts.ReturnStatement, void> {
    syntaxKind = ts.SyntaxKind.ReturnStatement;

    generate(returnStatement: ts.ReturnStatement, context: CodeGenerationContext): void {
        const returnAllocation = context.scope.returnAllocation;
        const returnBlock = context.scope.returnBlock;

        if (returnStatement.expression) {
            assert(returnAllocation, "No return allocation present but return statement is");
            const returnType = getExpectedReturnType(returnStatement, context.typeChecker);
            const expressionType = context.typeChecker.getTypeAtLocation(returnStatement.expression);

            if (!context.typeChecker.isAssignableTo(returnType, expressionType)) {
                throw CodeGenerationDiagnostic.unsupportedImplicitCastOfReturnValue(returnStatement, context.typeChecker.typeToString(returnType), context.typeChecker.typeToString(expressionType));
            }

            const returnValue = context.generateValue(returnStatement.expression);
            returnAllocation!.generateAssignmentIR(returnValue, context);
        }

        assert(returnBlock, "No return block present (not inside of a function?)");
        context.builder.createBr(returnBlock!);
    }
}

function getExpectedReturnType(node: ts.ReturnStatement, typeChecker: TypeChecker) {
    function findEnclosingFunction(node: ts.Node): ts.FunctionLikeDeclaration {
        if (node.kind === ts.SyntaxKind.FunctionExpression || node.kind === ts.SyntaxKind.FunctionDeclaration || node.kind === ts.SyntaxKind.ArrowFunction || node.kind === ts.SyntaxKind.MethodDeclaration) {
            return node as ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration | ts.MethodDeclaration;
        }

        assert(node.parent, "Node is not inside of a function");

        return findEnclosingFunction(node.parent!);
    }

    const fun = findEnclosingFunction(node);

    const signature = typeChecker.getSignatureFromDeclaration(fun);
    return signature.getReturnType();

}

export default ReturnStatementCodeGenerator;

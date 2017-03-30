import * as ts from "typescript";
import * as debug from "debug";
import {TransformVisitor, TransformVisitorContext} from "./transform-visitor";

const LOG = debug("transform/LogUnknownTransformVisitor");

/**
 * Logs yet unknown ts.Nodes
 */
export class LogUnknownTransformVisitor implements TransformVisitor {
    visitSourceFile(sourceFile: ts.SourceFile, context: TransformVisitorContext): ts.SourceFile {
        return context.visitEachChild(sourceFile);
    }

    visitFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration, context: TransformVisitorContext): ts.FunctionDeclaration {
        return context.visitEachChild(functionDeclaration);
    }

    visitExportKeyword(exportKeyword: ts.Token<ts.SyntaxKind.ExportKeyword>, context: TransformVisitorContext): ts.Token<ts.SyntaxKind.ExportKeyword> {
        return context.visitEachChild(exportKeyword);
    }

    visitIdentifier(identifier: ts.Identifier, context: TransformVisitorContext): ts.Identifier {
        return context.visitEachChild(identifier);
    }

    visitParameter(parameter: ts.ParameterDeclaration, context: TransformVisitorContext): ts.ParameterDeclaration {
        return context.visitEachChild(parameter);
    }

    visitNumberKeyword(keyword: ts.Token<ts.SyntaxKind.NumberKeyword>, context: TransformVisitorContext): ts.Token<ts.SyntaxKind.NumberKeyword> {
        return context.visitEachChild(keyword);
    }

    visitBlock(block: ts.Block, context: TransformVisitorContext): ts.Block {
        return context.visitEachChild(block);
    }

    visitExpressionStatement(expressionStatement: ts.ExpressionStatement, context: TransformVisitorContext): ts.ExpressionStatement {
        return context.visitEachChild(expressionStatement);
    }

    visitStringLiteral(stringLiteral: ts.Token<ts.SyntaxKind.StringLiteral>, context: TransformVisitorContext): ts.Token<ts.SyntaxKind.StringLiteral> {
        return context.visitEachChild(stringLiteral);
    }

    visitIfStatement(ifStatement: ts.IfStatement, context: TransformVisitorContext): ts.IfStatement {
        return context.visitEachChild(ifStatement);
    }

    visitBinaryExpression(binaryExpression: ts.BinaryExpression, context: TransformVisitorContext): ts.BinaryExpression {
        return context.visitEachChild(binaryExpression);
    }

    visitFirstLiteralToken(firstLiteralToken: ts.Token<ts.SyntaxKind.FirstLiteralToken>, context: TransformVisitorContext): ts.Token<ts.SyntaxKind.FirstLiteralToken> {
        return context.visitEachChild(firstLiteralToken);
    }

    visitReturnStatement(returnStatement: ts.ReturnStatement, context: TransformVisitorContext): ts.ReturnStatement {
        return context.visitEachChild(returnStatement);
    }

    visitCallExpression(callExpression: ts.CallExpression, context: TransformVisitorContext): ts.CallExpression {
        return context.visitEachChild(callExpression);
    }

    visitAsyncKeyword(asyncKeyword: ts.Token<ts.SyntaxKind.AsyncKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(asyncKeyword);
    }

    visitIntKeyword(intKeyword: ts.Token<ts.SyntaxKind.IntKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(intKeyword);
    }

    visitTypeReference(typeReference: ts.TypeReferenceNode, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(typeReference);
    }

    visitAwaitExpression(awaitExpression: ts.AwaitExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(awaitExpression);
    }

    visitVariableDeclaration(variableDeclaration: ts.VariableDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(variableDeclaration);
    }

    visitVariableDeclarationList(variableDeclarationList: ts.VariableDeclarationList, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(variableDeclarationList);
    }

    visitVariableStatement(variableStatement: ts.VariableStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(variableStatement);
    }

    visitNewExpression(newExpression: ts.NewExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(newExpression);
    }

    visitBooleanKeyword(booleanKeyword: ts.Token<ts.SyntaxKind.BooleanKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(booleanKeyword);
    }

    visitPropertyAccessExpression(propertyAccessExpression: ts.PropertyAccessExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(propertyAccessExpression);
    }

    visitTrueKeyword(trueKeyword: ts.Token<ts.SyntaxKind.TrueKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(trueKeyword);
    }

    visitForStatement(forStatement: ts.ForStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(forStatement);
    }

    visitPrefixUnaryExpression(prefixUnaryExpression: ts.PrefixUnaryExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(prefixUnaryExpression);
    }

    visitElementAccessExpression(elementAccessExpression: ts.ElementAccessExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(elementAccessExpression);
    }

    visitFalseKeyword(falseKeyword: ts.Token<ts.SyntaxKind.FalseKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(falseKeyword);
    }

    visitParenthesizedExpression(parenthesizedExpression: ts.ParenthesizedExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node> {
        return context.visitEachChild(parenthesizedExpression);
    }

    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T {
        LOG(`Unknown Node Type ${ts.SyntaxKind[node.kind]} - ${(node.constructor as any).name}`);
        return context.visitEachChild(node);
    }
}

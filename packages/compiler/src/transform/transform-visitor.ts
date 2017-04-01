import * as ts from "typescript";

export function createTransformVisitorFactory(transformVisitor: TransformVisitor): ts.TransformerFactory<ts.SourceFile> {
    return function (transformationContext: ts.TransformationContext) {
        return createTransformVisitor(transformVisitor, transformationContext);
    }
}

export function createTransformVisitor(transformVisitor: TransformVisitor, transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const context: TransformVisitorContext = {
        requestEmitHelper(emitHelper: ts.EmitHelper): void {
            transformationContext.requestEmitHelper(emitHelper);
        },

        visit<T extends ts.Node>(node: T, visitor?: TransformVisitor): T {
            visitor = visitor || transformVisitor;
            const kindName = ts.SyntaxKind[node.kind];
            const propertyName = `visit${kindName}`;

            const visitorFn = (visitor as any) [propertyName] as (node: ts.Node, context: TransformVisitorContext) => ts.VisitResult<ts.Node>;

            if (visitorFn) {
                return visitorFn.call(transformVisitor, node, context);
            } else {
                return visitor.fallback(node, context);
            }
        },

        visitEachChild(node: ts.Node, visitor?: TransformVisitor) {
            return ts.visitEachChild(node, child => context.visit(child, visitor), transformationContext);
        },

        visitLexicalEnvironment(nodes: ts.NodeArray<ts.Statement>, visitor?: TransformVisitor): ts.NodeArray<ts.Statement> {
            return ts.visitLexicalEnvironment(nodes, child => context.visit(child, visitor), transformationContext);
        }
    };

    return context.visit;
}

export interface TransformVisitor {
    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T;

    visitAsyncKeyword?(asyncKeyword: ts.Token<ts.SyntaxKind.AsyncKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitAwaitExpression?(awaitExpression: ts.AwaitExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitBinaryExpression?(binaryExpression: ts.BinaryExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitBlock?(block: ts.Block, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitBooleanKeyword?(booleanKeyword: ts.Token<ts.SyntaxKind.BooleanKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitCallExpression?(callExpression: ts.CallExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitElementAccessExpression?(elementAccessExpression: ts.ElementAccessExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitExpressionStatement?(expressionStatement: ts.ExpressionStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitExportKeyword?(exportKeyword: ts.Token<ts.SyntaxKind.ExportKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitFalseKeyword?(falseKeyword: ts.Token<ts.SyntaxKind.FalseKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitFirstLiteralToken?(firstLiteralToken: ts.Token<ts.SyntaxKind.FirstLiteralToken>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitForStatement?(forStatement: ts.ForStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitFunctionDeclaration?(functionDeclaration: ts.FunctionDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitIdentifier?(identifier: ts.Identifier, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitIfStatement?(ifStatement: ts.IfStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitIntKeyword?(intKeyword: ts.Token<ts.SyntaxKind.IntKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitNewExpression?(newExpression: ts.NewExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitNumberKeyword?(keyword: ts.Token<ts.SyntaxKind.NumberKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitParameter?(parameter: ts.ParameterDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitParenthesizedExpression?(parenthesizedExpression: ts.ParenthesizedExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitPrefixUnaryExpression?(prefixUnaryExpression: ts.PrefixUnaryExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitPropertyAccessExpression?(propertyAccessExpression: ts.PropertyAccessExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitReturnStatement?(returnStatement: ts.ReturnStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitSourceFile?(sourceFile: ts.SourceFile, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitStringLiteral?(stringLiteral: ts.Token<ts.SyntaxKind.StringLiteral>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitTrueKeyword?(trueKeyword: ts.Token<ts.SyntaxKind.TrueKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitTypeReference?(typeReference: ts.TypeReferenceNode, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitVariableDeclaration?(variableDeclaration: ts.VariableDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitVariableDeclarationList?(variableDeclarationList: ts.VariableDeclarationList, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitVariableStatement?(variableStatement: ts.VariableStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
}

export interface TransformVisitorContext {
    requestEmitHelper(emitHelper: ts.EmitHelper): void;
    visit<T extends ts.Node>(node: T, visitor?: TransformVisitor): T;
    visitEachChild<T extends ts.Node>(node: T, visitor?: TransformVisitor): T;
    visitLexicalEnvironment(nodes: ts.NodeArray<ts.Statement>, visitor?: TransformVisitor): ts.NodeArray<ts.Statement>;
}

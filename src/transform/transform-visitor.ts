import * as ts from "typescript";

export function createTransformVisitorFactory(transformVisitor: TransformVisitor): ts.TransformerFactory<ts.SourceFile> {
    return function (transformationContext: ts.TransformationContext) {
        return createTransformVisitor(transformVisitor, transformationContext);
    }
}

export function createTransformVisitor(transformVisitor: TransformVisitor, transformationContext: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
    const context: TransformVisitorContext = {
        visit<T extends ts.Node>(node: T, visitor?: TransformVisitor): T {
            visitor = visitor || transformVisitor;
            const kindName = ts.SyntaxKind[node.kind];
            const propertyName = `visit${kindName}`;

            if (visitor[propertyName]) {
                return visitor[propertyName].call(transformVisitor, node, context);
            } else {
                return visitor.fallback(node, context);
            }
        },

        visitEachChild(node: ts.Node, visitor?: TransformVisitor) {
            return ts.visitEachChild(node, child => context.visit(child, visitor), transformationContext);
        }
    };

    return context.visit;
}

export interface TransformVisitor {
    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T;

    visitSourceFile?(sourceFile: ts.SourceFile, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitFunctionDeclaration?(functionDeclaration: ts.FunctionDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitExportKeyword?(exportKeyword: ts.Token<ts.SyntaxKind.ExportKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitIdentifier?(identifier: ts.Identifier, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitParameter?(parameter: ts.ParameterDeclaration, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitNumberKeyword?(keyword: ts.Token<ts.SyntaxKind.NumberKeyword>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitBlock?(block: ts.Block, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitExpressionStatement?(expressionStatement: ts.ExpressionStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitStringLiteral?(stringLiteral: ts.Token<ts.SyntaxKind.StringLiteral>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitIfStatement?(ifStatement: ts.IfStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitBinaryExpression?(binaryExpression: ts.BinaryExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitFirstLiteralToken?(firstLiteralToken: ts.Token<ts.SyntaxKind.FirstLiteralToken>, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitReturnStatement?(returnStatement: ts.ReturnStatement, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
    visitCallExpression?(callExpression: ts.CallExpression, context: TransformVisitorContext): ts.VisitResult<ts.Node>;
}

export interface TransformVisitorContext {
    visit<T extends ts.Node>(node: T, visitor?: TransformVisitor): T;
    visitEachChild<T extends ts.Node>(node: T, visitor?: TransformVisitor): T;
}

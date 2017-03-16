import * as ts from "typescript";

export function isNode(potentiallyNode: any): potentiallyNode is ts.Node {
    return !!potentiallyNode.kind && typeof(ts.SyntaxKind[potentiallyNode.kind]) !== "undefined";
}

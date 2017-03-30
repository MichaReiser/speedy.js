import * as ts from "typescript";
import {TypeChecker} from "../../type-checker";

/**
 * Returns the type of the object to which the given node belongs to or undefined
 * @param node the node for which its belonging object (e.g. x for x.y) should be returned
 * @param typeChecker the type checker
 * @returns the type of the object node or undefined
 */
export function getTypeOfParentObject(node: ts.Node, typeChecker: TypeChecker): ts.ObjectType | undefined {
    if (node.kind === ts.SyntaxKind.PropertyAccessExpression || node.kind === ts.SyntaxKind.ElementAccessExpression) {
        const accessExpression = node as ts.PropertyAccessExpression | ts.ElementAccessExpression;
        return typeChecker.getTypeAtLocation(accessExpression.expression) as ts.ObjectType;
    }

    return undefined;
}

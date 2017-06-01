import * as ts from "typescript";

/**
 * tests if the passed function is a speedy js function
 * @param fun the function to test
 * @return {boolean} true if the function is a speedy js function
 */
export function isSpeedyJSFunction(fun: ts.FunctionLikeDeclaration) {
    if (!fun.body || !isBlock(fun.body)) {
        return false;
    }

    for (const statement of fun.body.statements) {
        if (isPrologueDirective(statement)) {
            if (statement.expression.text === "use speedyjs") {
                return true;
            }
        } else {
            break;
        }
    }
    return false;
}

/**
 * A speedy js function has the async modifier and contains "use speedyjs" directive
 * @param fun the function to test
 * @return {boolean} true if it is a speedy js entry function
 */
export function isSpeedyJSEntryFunction(fun: ts.FunctionLikeDeclaration): fun is ts.FunctionDeclaration {
    return isSpeedyJSFunction(fun) &&
        fun.kind === ts.SyntaxKind.FunctionDeclaration &&
        !!fun.modifiers &&
        !!fun.modifiers.find(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
}

interface PrologueDirective extends ts.ExpressionStatement {
    expression: ts.StringLiteral;
}

function isPrologueDirective(node: ts.Node): node is PrologueDirective {
    return node.kind === ts.SyntaxKind.ExpressionStatement && (node as ts.ExpressionStatement).expression.kind === ts.SyntaxKind.StringLiteral;
}

function isBlock(node: ts.Node): node is ts.Block {
    return node.kind === ts.SyntaxKind.Block;
}

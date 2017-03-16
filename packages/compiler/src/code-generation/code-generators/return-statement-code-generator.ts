import * as ts from "typescript";
import * as assert from "assert";
import {SyntaxCodeGenerator} from "../syntax-code-generator";
import {CodeGenerationContext} from "../code-generation-context";

class ReturnStatementCodeGenerator implements SyntaxCodeGenerator<ts.ReturnStatement> {
    syntaxKind = ts.SyntaxKind.ReturnStatement;

    generate(node: ts.ReturnStatement, context: CodeGenerationContext): void {
        const returnAllocation = context.scope.returnAllocation;
        const returnBlock = context.scope.returnBlock;

        if (node.expression) {
            assert(returnAllocation, "No return allocation present but return statement with value present");
            const returnValue = context.generate(node.expression);
            context.builder.createStore(returnValue, returnAllocation!);
        }

        assert(returnBlock, "No return block present (not inside of a function?)");
        context.builder.createBr(returnBlock!);
    }
}

export default ReturnStatementCodeGenerator;

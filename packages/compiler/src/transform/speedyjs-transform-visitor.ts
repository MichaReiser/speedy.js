import * as ts from "typescript";
import debug = require("debug");
import {TransformVisitor, TransformVisitorContext} from "./transform-visitor";
import {CodeGenerator} from "../code-generation/code-generator";
import {CompilationContext} from "../compilation-context";
import {CodeGenerationError} from "../code-generation/code-generation-error";
import {TypeChecker} from "../type-checker";

const LOG = debug("transform/speedyjs-transform-visitor");

export class SpeedyJSTransformVisitor implements TransformVisitor {

    constructor(private compilationContext: CompilationContext, private codeGenerator: CodeGenerator) {}

    visitSourceFile(sourceFile: ts.SourceFile, context: TransformVisitorContext) {
        this.codeGenerator.beginSourceFile(sourceFile, this.compilationContext, (emitHelper => context.requestEmitHelper(emitHelper)));

        sourceFile = ts.updateSourceFileNode(sourceFile, context.visitLexicalEnvironment(sourceFile.statements));

        return this.codeGenerator.completeSourceFile(sourceFile);
    }

    visitFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration, context: TransformVisitorContext) {
        if (!isSpeedyJSFunction(functionDeclaration)) {
            return context.visitEachChild(functionDeclaration);
        }

        const name = getName(functionDeclaration, this.compilationContext.typeChecker);

        LOG(`Found SpeedyJS Function ${name}`);
        validateSpeedyJSFunction(functionDeclaration);
        return this.codeGenerator.generateEntryFunction(functionDeclaration);
    }

    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T {
        // TODO change to throw
        LOG(`Node of kind ${ts.SyntaxKind[node.kind]} is not (yet) supported by SpeedyJS.`);
        return context.visitEachChild(node);
    }
}

function isSpeedyJSFunction(fun: ts.FunctionLikeDeclaration) {
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

function validateSpeedyJSFunction(fun: ts.FunctionDeclaration) {
    if (!fun.name) {
        throw CodeGenerationError.anonymousEntryFunctionsNotSupported(fun);
    }

    const async = !!fun.modifiers && !!fun.modifiers.find(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
    if (!async) {
        throw CodeGenerationError.entryFunctionNotAsync(fun);
    }

    const optional = fun.parameters.find(parameter => !!parameter.questionToken || !!parameter.dotDotDotToken);
    if (optional) {
        throw CodeGenerationError.optionalParametersInEntryFunctionNotSupported(optional);
    }

    if (fun.typeParameters && fun.typeParameters.length > 0) {
        throw CodeGenerationError.genericEntryFunctionNotSupported(fun);
    }
}

function getName(functionDeclaration: ts.FunctionDeclaration, typeChecker: TypeChecker) {
    if (!functionDeclaration.name) {
        return "**anonymous**";
    }

    const symbol = typeChecker.getSymbolAtLocation(functionDeclaration.name);
    return typeChecker.getFullyQualifiedName(symbol);
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

import * as ts from "typescript";
import {CodeGenerationDiagnostic} from "../code-generation-diagnostic";
import {CodeGenerator} from "../code-generation/code-generator";
import {CompilationContext} from "../compilation-context";
import {TypeChecker} from "../type-checker";
import {TransformVisitor, TransformVisitorContext} from "./transform-visitor";
import debug = require("debug");

const LOG = debug("transform/speedyjs-transform-visitor");

/**
 * SpeedyJS transformer that invokes the WebAssembly Code generator when ever a SpeedyJS Entry function is declared in the
 * source code (an entry function is marked async and with the "use speedyjs" directive.
 */
export class SpeedyJSTransformVisitor implements TransformVisitor {

    private inSpeedyJSFunction = false;

    constructor(private compilationContext: CompilationContext, private codeGenerator: CodeGenerator) {}

    /**
     * Rewrites the source file in case any speedy js functions have been declared in this source file
     */
    visitSourceFile(sourceFile: ts.SourceFile, context: TransformVisitorContext) {
        this.codeGenerator.beginSourceFile(sourceFile, this.compilationContext, (emitHelper => context.requestEmitHelper(emitHelper)));

        sourceFile = ts.updateSourceFileNode(sourceFile, context.visitLexicalEnvironment(sourceFile.statements));

        return this.codeGenerator.completeSourceFile(sourceFile);
    }

    /**
     * Tests if a 'normal' JavaScript function refers to a non entry SpeedyJS function.
     * If this is the case, an error is emitted.
     */
    visitIdentifier(identifier: ts.Identifier, context: TransformVisitorContext) {
        if (this.inSpeedyJSFunction) {
            return identifier;
        }

        const symbol = this.compilationContext.typeChecker.getSymbolAtLocation(identifier);

        if (typeof symbol !== "undefined" && symbol.flags & ts.SymbolFlags.Function) {
            for (const declaration of symbol.getDeclarations() as ts.FunctionLikeDeclaration[]) {
                if (isSpeedyJSFunction(declaration) && !isSpeedyJSEntryFunction(declaration)) {
                    throw CodeGenerationDiagnostic.referenceToNonSpeedyJSEntryFunctionFromJS(identifier, symbol);
                }
            }
        }

        return identifier;
    }

    /**
     * Tests if the given function is a speedy js entry function and in this case, triggers the web assembly code
     * generation for the given declaration.
     */
    visitFunctionDeclaration(functionDeclaration: ts.FunctionDeclaration, context: TransformVisitorContext) {
        const speedyJSFunction = isSpeedyJSFunction(functionDeclaration);

        if (!speedyJSFunction && functionDeclaration.body) {
            return context.visitEachChild(functionDeclaration);
        }

        const entryFunction = isSpeedyJSEntryFunction(functionDeclaration);
        this.inSpeedyJSFunction = true;

        try {
            if (entryFunction) {
                const name = getName(functionDeclaration, this.compilationContext.typeChecker);
                LOG(`Found SpeedyJS entry function ${name}`);
                validateSpeedyJSFunction(functionDeclaration, this.compilationContext.typeChecker);
                return this.codeGenerator.generateEntryFunction(functionDeclaration);
            } else {
                context.visitEachChild(functionDeclaration);
                return ts.createNotEmittedStatement(functionDeclaration); // remove the function
            }
        } finally {
            this.inSpeedyJSFunction = false;
        }
    }

    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T {
        return context.visitEachChild(node);
    }
}

/**
 * tests if the passed function is a speedy js function
 * @param fun the function to test
 * @return {boolean} true if the function is a speedy js function
 */
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

/**
 * A speedy js function has the async modifier and contains "use speedyjs" directive
 * @param fun the function to test
 * @return {boolean} true if it is a speedy js entry function
 */
function isSpeedyJSEntryFunction(fun: ts.FunctionLikeDeclaration) {
    return isSpeedyJSFunction(fun) && !!fun.modifiers && !!fun.modifiers.find(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword);
}

/**
 * Tests if the given function is a valid speedy js function.
 * A function is a valid SpeedyJS function if
 * * it has a name
 * * it has no optional arguments (is not overloaded)
 * * is not overloaded
 * * is not generic
 * @param fun the function to test
 * @param typeChecker the type checker
 * @throws if the function is not valid
 */
function validateSpeedyJSFunction(fun: ts.FunctionDeclaration, typeChecker: TypeChecker) {
    if (!fun.name) {
        throw CodeGenerationDiagnostic.anonymousEntryFunctionsNotSupported(fun);
    }

    const optional = fun.parameters.find(parameter => !!parameter.questionToken || !!parameter.dotDotDotToken);
    if (optional) {
        throw CodeGenerationDiagnostic.optionalParametersInEntryFunctionNotSupported(optional);
    }

    if (fun.typeParameters && fun.typeParameters.length > 0) {
        throw CodeGenerationDiagnostic.genericEntryFunctionNotSupported(fun);
    }

    if (typeChecker.isImplementationOfOverload(fun)) {
        throw CodeGenerationDiagnostic.overloadedEntryFunctionNotSupported(fun);
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

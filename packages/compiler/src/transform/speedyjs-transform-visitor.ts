import debug = require("debug");
import * as ts from "typescript";
import {CodeGenerationDiagnostics} from "../code-generation-diagnostic";
import {CodeGenerator} from "../code-generation/code-generator";
import {isFunctionType} from "../code-generation/util/types";
import {CompilationContext} from "../compilation-context";
import {TypeChecker} from "../type-checker";
import {isSpeedyJSEntryFunction, isSpeedyJSFunction} from "../util/speedyjs-function";
import {TransformVisitor, TransformVisitorContext} from "./transform-visitor";

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
        const symbol = this.compilationContext.typeChecker.getSymbolAtLocation(identifier);

        if (typeof symbol !== "undefined" && symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Method | ts.SymbolFlags.Constructor)) {
            for (const declaration of symbol.getDeclarations() as ts.FunctionLikeDeclaration[]) {
                if (this.inSpeedyJSFunction && !canBeCalledFromSpeedyJs(declaration)) {
                    throw CodeGenerationDiagnostics.refereneToNonSpeedyJSFunctionFromSpeedyJS(identifier, symbol);
                } else if (!this.inSpeedyJSFunction && !canBeCalledFromJs(declaration)) {
                    throw CodeGenerationDiagnostics.referenceToNonSpeedyJSEntryFunctionFromJS(identifier, symbol);
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
        return this.visitFunctionLikeDeclaration(functionDeclaration, context);
    }

    visitMethodDeclaration(methodDeclaration: ts.MethodDeclaration, context: TransformVisitorContext) {
        return this.visitFunctionLikeDeclaration(methodDeclaration, context);
    }

    visitConstructor(constructorDeclaration: ts.ConstructorDeclaration, context: TransformVisitorContext) {
        return this.visitFunctionLikeDeclaration(constructorDeclaration, context);
    }

    visitFunctionLikeDeclaration(functionLikeDeclaration: ts.FunctionLikeDeclaration, context: TransformVisitorContext) {
        const speedyJSFunction = isSpeedyJSFunction(functionLikeDeclaration);

        if (!speedyJSFunction) {
            return context.visitEachChild(functionLikeDeclaration);
        }

        const wasInSpeedyJSFunction = this.inSpeedyJSFunction;
        this.inSpeedyJSFunction = true;
        try {
            const visited = context.visitEachChild(functionLikeDeclaration);

            if (isSpeedyJSEntryFunction(functionLikeDeclaration)) {
                const name = getName(functionLikeDeclaration, this.compilationContext.typeChecker);
                LOG(`Found SpeedyJS entry function ${name}`);
                validateSpeedyJSFunction(functionLikeDeclaration, this.compilationContext.typeChecker);
                return this.codeGenerator.generateEntryFunction(functionLikeDeclaration);
            } else if (functionLikeDeclaration.kind === ts.SyntaxKind.FunctionDeclaration) {
                return ts.createNotEmittedStatement(functionLikeDeclaration); // remove the function
            } else {
                return visited; // do not remove methods or constructors
            }
        } finally {
            this.inSpeedyJSFunction = wasInSpeedyJSFunction;
        }
    }

    fallback<T extends ts.Node>(node: T, context: TransformVisitorContext): T {
        return context.visitEachChild(node);
    }
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
function validateSpeedyJSFunction(fun: ts.FunctionLikeDeclaration, typeChecker: TypeChecker) {
    if (!fun.name) {
        throw CodeGenerationDiagnostics.anonymousEntryFunctionsNotSupported(fun);
    }

    const optional = fun.parameters.find(parameter => !!parameter.questionToken || !!parameter.dotDotDotToken);
    if (optional) {
        throw CodeGenerationDiagnostics.optionalParametersInEntryFunctionNotSupported(optional);
    }

    if (fun.typeParameters && fun.typeParameters.length > 0) {
        throw CodeGenerationDiagnostics.genericEntryFunctionNotSupported(fun);
    }

    if (typeChecker.isImplementationOfOverload(fun)) {
        throw CodeGenerationDiagnostics.overloadedEntryFunctionNotSupported(fun);
    }

    const callbackParameter = fun.parameters.find(parameter => isFunctionType(typeChecker.getTypeAtLocation(parameter)));
    if (callbackParameter !==  undefined) {
        throw CodeGenerationDiagnostics.entryFunctionWithCallbackNotSupported(callbackParameter);
    }
}

function getName(functionDeclaration: ts.FunctionLikeDeclaration, typeChecker: TypeChecker) {
    if (!functionDeclaration.name) {
        return "**anonymous**";
    }

    const symbol = typeChecker.getSymbolAtLocation(functionDeclaration.name);
    return typeChecker.getFullyQualifiedName(symbol);
}

function canBeCalledFromJs(declaration: ts.FunctionLikeDeclaration) {
    // methods and constructors are find as object can be shared between JavaScript and Speedy.js
    return declaration.kind !== ts.SyntaxKind.FunctionDeclaration ||
        !isSpeedyJSFunction(declaration) ||
        isSpeedyJSEntryFunction(declaration);
}

function canBeCalledFromSpeedyJs(declaration: ts.FunctionLikeDeclaration) {
    return !declaration.body || isSpeedyJSFunction(declaration);
}

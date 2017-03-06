import * as llvm from "llvm-node";
import * as ts from "typescript";
const packageJson = require("./package.json");
import {reportDiagnostics} from "./src/util/diagnostics";
import {createTransformVisitorFactory} from "./src/transform/transform-visitor";
import {LogUnknownTransformVisitor} from "./src/transform/log-unknown-transform-visitor";
import {SpeedyJSTransformVisitor} from "./src/transform/speedyjs-transform-visitor";
import {PerFileCodeGenerator} from "./src/code-generation/per-file-code-generator";
import {DefaultCodeGenerationContextFactory} from "./src/code-generation/default-code-generation-context-factory";
import {NotYetImplementedCodeGenerator} from "./src/code-generation/not-yet-implemented-code-generator";

llvm.initializeAllTargets();
llvm.initializeAllTargetInfos();
llvm.initializeAllAsmPrinters();
llvm.initializeAllTargetMCs();
llvm.initializeAllAsmParsers();

function parseConfigFile(configFileName: string, commandLine: ts.ParsedCommandLine): ts.ParsedCommandLine {
    const configurationFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    if (configurationFile.error) {
        reportDiagnostics([configurationFile.error]);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    const configurationFileText = ts.sys.readFile(configFileName);
    const configAsJson = ts.parseConfigFileTextToJson(configFileName, configurationFileText);

    if (configAsJson.error) {
        reportDiagnostics([configAsJson.error]);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    const parsedConfiguration = ts.parseJsonConfigFileContent(configAsJson, ts.sys, ".", commandLine.options, configFileName);
    if (parsedConfiguration.errors.length > 0) {
        reportDiagnostics(parsedConfiguration.errors);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    return parsedConfiguration;
}

function run() {
    const commandLine = ts.parseCommandLine(ts.sys.args);
    if (commandLine.errors.length > 0) {
        reportDiagnostics(commandLine.errors);
        return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    if (commandLine.options.version) {
        ts.sys.write(`speedyjs ${packageJson.version}${ts.sys.newLine}`);
        return ts.sys.exit(ts.ExitStatus.Success);
    }

    const configFileName = ts.findConfigFile(ts.sys.getCurrentDirectory(), ts.sys.fileExists);

    if (commandLine.fileNames.length === 0 && !configFileName) {
        ts.sys.write("TODO");
        ts.sys.exit(ts.ExitStatus.Success);
    }

    const configuration = parseConfigFile(configFileName, commandLine);
    const rootFileNames = configuration.fileNames;
    const compilerOptions = configuration.options;

    const compilerHost = ts.createCompilerHost(compilerOptions);

    const program: ts.Program = ts.createProgram(rootFileNames, compilerOptions, compilerHost);
    const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(), ...program.getSemanticDiagnostics() ];

    const context = new llvm.LLVMContext();
    const llvmEmitter = new PerFileCodeGenerator(context, new DefaultCodeGenerationContextFactory(new NotYetImplementedCodeGenerator()));

    const logUnknownVisitor = new LogUnknownTransformVisitor();
    const speedyJSVisitor = new SpeedyJSTransformVisitor(program, llvmEmitter);

    const emitResult = program.emit(undefined, undefined, undefined, undefined, { before: [
        createTransformVisitorFactory(logUnknownVisitor),
        createTransformVisitorFactory(speedyJSVisitor)
    ]});

    llvmEmitter.write();

    reportDiagnostics(emitResult.diagnostics, compilerHost);

    if (emitResult.emitSkipped && diagnostics.length > 0) {
        return ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    } else if (diagnostics.length > 0) {
        return ts.ExitStatus.DiagnosticsPresent_OutputsGenerated;
    }

    return ts.sys.exit(ts.ExitStatus.Success);
}

run();

/*
function transformerFactory<T extends ts.Node>(context: ts.TransformationContext): ts.Transformer<T> {
    context.enableSubstitution(ts.SyntaxKind.FunctionDeclaration);
    return function myTransformer<T extends ts.Node>(node: T): T {
        if (isPrologueDirective(node)) {
            if (node.expression.text === "use speedyjs") {
                node.expression.text = "use strict";
            }
            return ts.createStatement(ts.createLiteral("use strict"));
        }
        if (isFunctionDeclaration(node)) {
            return ts.createFunctionDeclaration();
            const functionDeclaration = node as ts.FunctionDeclaration;
            const symbol = typeChecker.getSymbolAtLocation(node);
            for (const child of node.body.statements) {

                    break;
            }
        }

        return ts.visitEachChild(node, myTransformer, context);
    };
}



function isFunctionDeclaration(node: ts.Node): node is ts.FunctionDeclaration {
    return node.kind === ts.SyntaxKind.FunctionDeclaration;
}
*/

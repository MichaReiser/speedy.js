#!/usr/bin/env node

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
import {Compiler} from "./src/compiler";

llvm.initializeAllTargets();
llvm.initializeAllTargetInfos();
llvm.initializeAllAsmPrinters();
llvm.initializeAllTargetMCs();
llvm.initializeAllAsmParsers();

function parseConfigFile(configFileName: string, commandLine: ts.ParsedCommandLine): ts.ParsedCommandLine {
    const configurationFileText = ts.sys.readFile(configFileName);
    const jsonConfig = ts.parseConfigFileTextToJson(configFileName, configurationFileText);
    if (jsonConfig.error) {
        reportDiagnostics([jsonConfig.error]);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    const parsedConfiguration = ts.parseJsonConfigFileContent(jsonConfig.config, ts.sys, ".", commandLine.options, configFileName);
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
        ts.sys.write(`speedy.js ${packageJson.version}${ts.sys.newLine}`);
        return ts.sys.exit(ts.ExitStatus.Success);
    }

    const configFileName = ts.findConfigFile(ts.sys.getCurrentDirectory(), ts.sys.fileExists);

    if (commandLine.fileNames.length === 0 && !configFileName) {
        ts.sys.write("TODO");
        ts.sys.exit(ts.ExitStatus.Success);
    }

    let rootFileNames: string[] = [];
    let compilerOptions;

    if (configFileName) {
        const configuration = parseConfigFile(configFileName, commandLine);
        rootFileNames = configuration.fileNames;
        compilerOptions = configuration.options;
    } else {
        rootFileNames = commandLine.fileNames;
        compilerOptions = commandLine.options;
    }

    const compilerHost = ts.createCompilerHost(compilerOptions);
    const compiler = new Compiler(compilerOptions, compilerHost);

    const { diagnostics, exitStatus } = compiler.compile(rootFileNames);
    if (diagnostics.length > 0) {
        reportDiagnostics(diagnostics);
    }

    return ts.sys.exit(exitStatus);
}

run();

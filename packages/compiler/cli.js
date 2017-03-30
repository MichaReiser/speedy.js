#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
var program = require("commander");
var packageJson = require("./package.json");
var diagnostics_1 = require("./src/util/diagnostics");
var compiler_1 = require("./src/compiler");
var speedyjs_compiler_options_1 = require("./src/speedyjs-compiler-options");
function parseCommandLine() {
    function parseSettings(setting, memo) {
        var _a = setting.split("="), key = _a[0], value = _a[1];
        memo[key] = parseInt(value);
        return memo;
    }
    program
        .version(packageJson.version)
        .usage("[options] [files ...]")
        .option("-c --config <configFile>", "The path to the tsconfig.json")
        .option("--unsafe", "Use the unsafe runtime system")
        .option("--emit-llvm", "Emit LLVM Assembly Code instead of WASM files")
        .option("--binaryen-opt", "Optimize using Binaryen opt")
        .option("-s --settings [value]", "additional settings", parseSettings, {})
        .parse(process.argv);
    return program;
}
function parseConfigFile(configFileName) {
    var configurationFileText = ts.sys.readFile(configFileName);
    var jsonConfig = ts.parseConfigFileTextToJson(configFileName, configurationFileText);
    if (jsonConfig.error) {
        diagnostics_1.reportDiagnostics([jsonConfig.error]);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    var parsedConfiguration = ts.parseJsonConfigFileContent(jsonConfig.config, ts.sys, path.dirname(configFileName), undefined, configFileName);
    if (parsedConfiguration.errors.length > 0) {
        diagnostics_1.reportDiagnostics(parsedConfiguration.errors);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    return parsedConfiguration;
}
function getCompilerOptions(commandLine, tsConfigFileName) {
    var rootFileNames = [];
    var compilerOptions;
    if (tsConfigFileName) {
        var configuration = parseConfigFile(tsConfigFileName);
        rootFileNames = configuration.fileNames;
        compilerOptions = configuration.options;
    }
    else {
        rootFileNames = commandLine.files;
        compilerOptions = ts.getDefaultCompilerOptions();
    }
    compilerOptions.unsafe = commandLine.unsafe;
    compilerOptions.binaryenOpt = commandLine.binaryenOpt;
    compilerOptions.emitLLVM = commandLine.emitLlvm;
    compilerOptions.globalBase = commandLine.settings.GLOBAL_BASE;
    compilerOptions.totalMemory = commandLine.settings.TOTAL_MEMORY;
    compilerOptions.totalStack = commandLine.settings.TOTAL_STACK;
    return { rootFileNames: rootFileNames, compilerOptions: speedyjs_compiler_options_1.initializeCompilerOptions(compilerOptions) };
}
function run() {
    var commandLine = parseCommandLine();
    var configFileName = commandLine.config || ts.findConfigFile(ts.sys.getCurrentDirectory(), ts.sys.fileExists);
    if (commandLine.args.length === 0 && !configFileName) {
        ts.sys.write("Pass either a config file or the files to use");
        commandLine.outputHelp();
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }
    var _a = getCompilerOptions(commandLine, configFileName), compilerOptions = _a.compilerOptions, rootFileNames = _a.rootFileNames;
    var compilerHost = ts.createCompilerHost(compilerOptions);
    var compiler = new compiler_1.Compiler(compilerOptions, compilerHost);
    var _b = compiler.compile(rootFileNames), diagnostics = _b.diagnostics, exitStatus = _b.exitStatus;
    if (diagnostics.length > 0) {
        diagnostics_1.reportDiagnostics(diagnostics);
    }
    return ts.sys.exit(exitStatus);
}
run();
//# sourceMappingURL=cli.js.map
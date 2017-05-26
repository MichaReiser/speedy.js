#!/usr/bin/env node

import * as program from "commander";
import * as path from "path";
import * as ts from "typescript";
import {Compiler} from "./src/compiler";
import {initializeCompilerOptions, UninitializedSpeedyJSCompilerOptions} from "./src/speedyjs-compiler-options";
import {reportDiagnostics} from "./src/util/diagnostics";

// tslint:disable-next-line
const packageJson = require("./package.json");

interface CommandLineArguments {
    /**
     * The name of the files to prØocess
     */
    args: string[];
    config?: string;
    unsafe?: boolean;
    emitLlvm?: boolean;
    saveWast?: boolean;
    saveBc?: boolean;
    binaryenOpt?: boolean;
    disableHeapNukeOnExit?: boolean;
    exposeGc?: boolean;
    exportGc?: boolean;
    optimizationLevel?: "0" | "1" | "2" | "3" | "z" | "s";
    settings: {
        INITIAL_MEMORY?: number;
        TOTAL_STACK?: number;
        GLOBAL_BASE?: number;
    };

    outputHelp(): void;
}

function parseCommandLine(): CommandLineArguments {
    function parseSettings(setting: string, memo: any) {
        const [key, value] = setting.split("=");
        memo[key] = parseInt(value, 10);
        return memo;
    }

    // tslint:disable:max-line-length
    program
        .version(packageJson.version)
        .usage("[options] [files ...]")
        .option("-c --config <configFile>", "The path to the tsconfig.json")
        .option("--unsafe", "Use the unsafe runtime system")
        .option("--emit-llvm", "Emit LLVM Assembly Code instead of WASM files")
        .option("--save-wast", "Saves the WAST file in the output directory if compiling all the way to WebAssembly")
        .option("--save-bc", "Saves a copy of the bitcode to the output directory if compiling all the way to WebAssembly. The file includes the linked and optimized code.")
        .option("--binaryen-opt", "Optimize using Binaryen opt")
        .option("--expose-gc", "Exposes the speedy js garbage collector in the module as speedyJsGc")
        .option("--export-gc", "Exposes and exports the speedy js garbage collector as the symbol speedyJsGc")
        .option("--disable-heap-nuke-on-exit", "Disables nuking of the heap before to the exit of the entry function (it's your responsible for calling the GC in this case!)")
        .option("--optimization-level [value]", "The optimization level to use. One of the following values: '0, 1, 2, 3, s or z'")
        .option("-s --settings [value]", "additional settings", parseSettings, {})
        .parse(process.argv);
    // tslint:enable:max-line-length

    return program as any as CommandLineArguments;
}

function parseConfigFile(configFileName: string): ts.ParsedCommandLine {
    const configurationFileText = ts.sys.readFile(configFileName);
    const jsonConfig = ts.parseConfigFileTextToJson(configFileName, configurationFileText);
    if (jsonConfig.error) {
        reportDiagnostics([jsonConfig.error]);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    const parsedConfiguration = ts.parseJsonConfigFileContent(jsonConfig.config, ts.sys, path.dirname(configFileName), undefined, configFileName);
    if (parsedConfiguration.errors.length > 0) {
        reportDiagnostics(parsedConfiguration.errors);
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    return parsedConfiguration;
}

function getCompilerOptions(commandLine: CommandLineArguments, tsConfigFileName: string) {
    let rootFileNames: string[] = [];
    let compilerOptions: UninitializedSpeedyJSCompilerOptions;

    if (tsConfigFileName) {
        const configuration = parseConfigFile(tsConfigFileName);
        rootFileNames = commandLine.args || configuration.fileNames;
        compilerOptions = configuration.options;
    } else {
        rootFileNames = commandLine.args;
        compilerOptions = ts.getDefaultCompilerOptions();
    }

    compilerOptions.unsafe = commandLine.unsafe;
    compilerOptions.binaryenOpt = commandLine.binaryenOpt;
    compilerOptions.emitLLVM = commandLine.emitLlvm;
    compilerOptions.saveWast = commandLine.saveWast;
    compilerOptions.saveBc = commandLine.saveBc;
    compilerOptions.globalBase = commandLine.settings.GLOBAL_BASE;
    compilerOptions.totalMemory = commandLine.settings.INITIAL_MEMORY;
    compilerOptions.totalStack = commandLine.settings.TOTAL_STACK;
    compilerOptions.exposeGc = commandLine.exposeGc;
    compilerOptions.exportGc = commandLine.exportGc;
    compilerOptions.disableHeapNukeOnExit = commandLine.disableHeapNukeOnExit;
    compilerOptions.optimizationLevel = commandLine.optimizationLevel;

    return { rootFileNames, compilerOptions: initializeCompilerOptions(compilerOptions) };
}

function run() {
    const commandLine = parseCommandLine();

    const configFileName = commandLine.config || ts.findConfigFile(ts.sys.getCurrentDirectory(), ts.sys.fileExists);

    if (commandLine.args.length === 0 && !configFileName) {
        ts.sys.write("Pass either a config file or the files to use");
        commandLine.outputHelp();
        ts.sys.exit(ts.ExitStatus.DiagnosticsPresent_OutputsSkipped);
    }

    const { compilerOptions, rootFileNames } = getCompilerOptions(commandLine, configFileName);
    const compilerHost = ts.createCompilerHost(compilerOptions);
    const compiler = new Compiler(compilerOptions, compilerHost);

    const { diagnostics, exitStatus } = compiler.compile(rootFileNames);
    if (diagnostics.length > 0) {
        reportDiagnostics(diagnostics);
    }

    return ts.sys.exit(exitStatus);
}

run();

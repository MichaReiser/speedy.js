import * as ts from "typescript";
import * as assert from "assert";
import * as path from "path";

import { initializeCompilerOptions, SpeedyJSCompilerOptions, UninitializedSpeedyJSCompilerOptions} from "./speedyjs-compiler-options";
import {Compiler} from "./compiler";

function getInitializedCompilerOptions(options?: UninitializedSpeedyJSCompilerOptions): SpeedyJSCompilerOptions{
    options = options || ts.getDefaultCompilerOptions();

    // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts between input and output paths.
    options.suppressOutputPathCheck = true;

    // Clear out other settings that would not be used in transpiling this module
    options.noEmit = undefined;
    options.noEmitOnError = undefined;
    options.out = undefined;
    options.outFile = undefined;

    return initializeCompilerOptions(options);
}

/**
 * This function compiles the given source code in memory and returns the result as object instead of writing the result to disk.
 *
 * @param sourceCode the source code of the file to transpile
 * @param inputFileName the name of the file
 * @param options the compiler options
 */
export function compileSourceCode(sourceCode: string, inputFileName: string, options?: UninitializedSpeedyJSCompilerOptions) {
    const initializedOptions = getInitializedCompilerOptions(options);

    const defaultHost = ts.createCompilerHost(initializedOptions);

    let sourceFile: ts.SourceFile | undefined;
    let outputText: string | undefined;
    let sourceMapText: string | undefined;

    const compilerHost: ts.CompilerHost = {
        directoryExists() {
            return defaultHost.directoryExists!.apply(defaultHost, arguments);
        },
        fileExists(fileName: string): boolean {
            return fileName === inputFileName || defaultHost.fileExists.apply(defaultHost, arguments);
        },
        getCanonicalFileName() {
            return defaultHost.getCanonicalFileName.apply(defaultHost, arguments);
        },
        getCurrentDirectory() {
            return defaultHost.getCurrentDirectory.apply(defaultHost, arguments);
        },
        getDefaultLibFileName() {
            return defaultHost.getDefaultLibFileName.apply(defaultHost, arguments);
        },
        getDefaultLibLocation() {
            return defaultHost.getDefaultLibLocation!.apply(defaultHost, arguments);
        },
        getDirectories() {
            return defaultHost.getDirectories.apply(defaultHost, arguments);
        },
        getEnvironmentVariable() {
            return defaultHost.getEnvironmentVariable!.apply(defaultHost, arguments);
        },
        getNewLine() {
            return defaultHost.getNewLine.apply(defaultHost, arguments);
        },
        getSourceFile(fileName: string, languageVersion: ts.ScriptTarget) {
            if (fileName === path.normalize(inputFileName)) {
                return sourceFile = sourceFile || ts.createSourceFile(fileName, sourceCode, languageVersion);
            }

            return defaultHost.getSourceFile.apply(defaultHost, arguments);
        },
        readFile() {
            return defaultHost.readFile.apply(defaultHost, arguments);
        },
        realpath() {
            return defaultHost.realpath!.apply(defaultHost, arguments);
        },
        trace() {
            return defaultHost.trace!.apply(defaultHost, arguments);
        },
        useCaseSensitiveFileNames() {
            return defaultHost.useCaseSensitiveFileNames.apply(defaultHost, arguments);
        },
        writeFile(name: string, text: string){
            if (name.endsWith(".map")) {
                assert(sourceMapText === undefined, `Unexpected multiple source map outputs for the file '${name}'`);
                sourceMapText = text;
            }
            else {
                assert(outputText === undefined, `Unexpected multiple outputs for the file: '${name}'`);
                outputText = text;
            }
        }
    };

    const compiler = new Compiler(initializedOptions, compilerHost);
    const result = compiler.compile([inputFileName]);

    return { outputText: outputText!, diagnostics: result.diagnostics, sourceMapText, exitStatus: result.exitStatus };
}

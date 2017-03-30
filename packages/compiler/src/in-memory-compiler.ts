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

    // We are not doing a full typecheck, we are not resolving the whole context,
    // so pass --noResolve to avoid reporting missing file errors.

    return initializeCompilerOptions(options);
}

/**
 * This function compiles the given source code inline and returns the result as object.
 * Similar to ts.transpileModule
 *
 * source code mostly taken from TypeScript
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
        getSourceFile(fileName: string, languageVersion: ts.ScriptTarget) {
            if (fileName === path.normalize(inputFileName)) {
                return sourceFile = sourceFile || ts.createSourceFile(fileName, sourceCode, languageVersion);
            }

            return defaultHost.getSourceFile.apply(defaultHost, arguments);
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
        },
        getDefaultLibFileName() {
            return defaultHost.getDefaultLibFileName.apply(defaultHost, arguments);
        },
        getDefaultLibLocation() {
            return defaultHost.getDefaultLibLocation!.apply(defaultHost, arguments);
        },
        useCaseSensitiveFileNames() {
            return defaultHost.useCaseSensitiveFileNames.apply(defaultHost, arguments);
        },
        getCanonicalFileName() {
            return defaultHost.getCanonicalFileName.apply(defaultHost, arguments);
        },
        getCurrentDirectory() {
            return defaultHost.getCurrentDirectory.apply(defaultHost, arguments);
        },
        getNewLine() {
            return defaultHost.getNewLine.apply(defaultHost, arguments);
        },
        fileExists(fileName: string): boolean {
            return fileName === inputFileName || defaultHost.fileExists.apply(defaultHost, arguments);
        },
        readFile() {
            return defaultHost.readFile.apply(defaultHost, arguments);
        },
        getDirectories() {
            return defaultHost.getDirectories.apply(defaultHost, arguments);
        }
    };

    const compiler = new Compiler(initializedOptions, compilerHost);
    const result = compiler.compile([inputFileName]);

    return { outputText: outputText!, diagnostics: result.diagnostics, sourceMapText, exitStatus: result.exitStatus };
}

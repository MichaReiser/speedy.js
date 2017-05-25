import * as ts from "typescript";

/** Mostly copied from TypeScript Source as it is not exposed */

function createGetCanonicalFileName(useCaseSensitiveFileNames: boolean): (name: string) => string {
    return useCaseSensitiveFileNames
        ? fileName => fileName
        : fileName => fileName.toLowerCase();
}

const defaultFormatDiagnosticHost: ts.FormatDiagnosticsHost = {
    getCurrentDirectory() {
        return ts.sys.getCurrentDirectory();
    },

    getNewLine() {
        return ts.sys.newLine;
    },

    getCanonicalFileName: createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames)
};

/**
 * Prints the given diagnostic messages to the console
 * @param diagnostics the diagnostics to report
 * @param compilerHost the compiler host
 */
export function reportDiagnostics(diagnostics: ts.Diagnostic[], compilerHost?: ts.CompilerHost): void {
    for (const diagnostic of diagnostics) {
        ts.sys.write(formatDiagnostics([diagnostic], compilerHost));
    }
}

/**
 * Formats the given diagnostics as a string
 * @param diagnostics the diagnostics to format
 * @param compilerHost the compiler hsot
 * @return {string} the diagnostics as string
 */
export function formatDiagnostics(diagnostics: ts.Diagnostic[], compilerHost?: ts.CompilerHost): string {
    return ts.formatDiagnostics(diagnostics, compilerHost || defaultFormatDiagnosticHost);
}

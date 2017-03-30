import * as ts from "typescript";

/** Mostly copied from TypeScript Source as it is not exposed */

function createGetCanonicalFileName(useCaseSensitiveFileNames: boolean): (name: string) => string {
    return useCaseSensitiveFileNames
        ? (function (fileName) { return fileName; })
        : (function (fileName) { return fileName.toLowerCase(); });
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

export function reportDiagnostics(diagnostics: ts.Diagnostic[], compilerHost?: ts.CompilerHost): void {
    for (const diagnostic of diagnostics) {
        ts.sys.write(formatDiagnostics([diagnostic]));
    }
}

export function formatDiagnostics(diagnostics: ts.Diagnostic[], compilerHost?: ts.CompilerHost): string {
    return ts.formatDiagnostics(diagnostics, compilerHost || defaultFormatDiagnosticHost)
}

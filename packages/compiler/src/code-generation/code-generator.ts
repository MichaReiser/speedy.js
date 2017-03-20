import * as ts from "typescript";

export interface CodeGenerator {
    generateEntryFunction(fn: ts.FunctionDeclaration, program: ts.Program);
    write();
    dump();
}

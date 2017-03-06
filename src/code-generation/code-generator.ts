import * as ts from "typescript";

export interface CodeGenerator {
    generate(node: ts.Node, program: ts.Program);
    write();
    dump();
}

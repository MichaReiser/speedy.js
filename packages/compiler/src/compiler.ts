import * as ts from "typescript";
import * as llvm from "llvm-node";
import {DefaultCodeGenerationContextFactory} from "./code-generation/default-code-generation-context-factory";
import {PerFileCodeGenerator} from "./code-generation/per-file-code-generator";
import {NotYetImplementedCodeGenerator} from "./code-generation/not-yet-implemented-code-generator";
import {LogUnknownTransformVisitor} from "./transform/log-unknown-transform-visitor";
import {SpeedyJSTransformVisitor} from "./transform/speedyjs-transform-visitor";
import {createTransformVisitorFactory} from "./transform/transform-visitor";

export class Compiler {
    constructor(private compilerOptions: ts.CompilerOptions, private compilerHost: ts.CompilerHost) {
        this.compilerHost = ts.createCompilerHost(compilerOptions);
    }

    compile(rootFileNames: string[], writeFile?: ts.WriteFileCallback): { exitStatus: ts.ExitStatus, diagnostics: ts.Diagnostic[] } {
        const program: ts.Program = ts.createProgram(rootFileNames, this.compilerOptions, this.compilerHost);
        const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(), ...program.getSemanticDiagnostics() ];

        if (diagnostics.length > 0) {
            return { diagnostics, exitStatus: ts.ExitStatus.DiagnosticsPresent_OutputsSkipped };
        }

        const context = new llvm.LLVMContext();
        const llvmEmitter = new PerFileCodeGenerator(context, new DefaultCodeGenerationContextFactory(new NotYetImplementedCodeGenerator()));

        const logUnknownVisitor = new LogUnknownTransformVisitor();
        const compilationContext = {
            compilerHost: this.compilerHost,
            compilerOptions: this.compilerOptions,
            llvmContext: context,
            program
        };

        const speedyJSVisitor = new SpeedyJSTransformVisitor(compilationContext, llvmEmitter);

        const emitResult = program.emit(undefined, undefined, undefined, undefined, { before: [
            createTransformVisitorFactory(logUnknownVisitor),
            createTransformVisitorFactory(speedyJSVisitor)
        ]});

        llvmEmitter.write();

        const exitStatus = emitResult.emitSkipped ? ts.ExitStatus.DiagnosticsPresent_OutputsSkipped : ts.ExitStatus.Success;
        return { exitStatus, diagnostics: emitResult.diagnostics };
    }
}

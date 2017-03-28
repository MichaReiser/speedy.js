import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as debug from "debug";
import {DefaultCodeGenerationContextFactory} from "./code-generation/default-code-generation-context-factory";
import {PerFileCodeGenerator} from "./code-generation/per-file-code-generator";
import {NotYetImplementedCodeGenerator} from "./code-generation/not-yet-implemented-code-generator";
import {LogUnknownTransformVisitor} from "./transform/log-unknown-transform-visitor";
import {SpeedyJSTransformVisitor} from "./transform/speedyjs-transform-visitor";
import {createTransformVisitorFactory} from "./transform/transform-visitor";
import {BuiltInSymbols} from "./built-in-symbols";
import {CompilationContext} from "./compilation-context";
import {CodeGenerationError} from "./code-generation/code-generation-exception";

const LOG = debug("compiler");

export class Compiler {
    constructor(private compilerOptions: ts.CompilerOptions, private compilerHost: ts.CompilerHost) {
        this.compilerHost = ts.createCompilerHost(compilerOptions);
    }

    compile(rootFileNames: string[]): { exitStatus: ts.ExitStatus, diagnostics: ts.Diagnostic[] } {
        LOG("Start Compiling");
        const program: ts.Program = ts.createProgram(rootFileNames, this.compilerOptions, this.compilerHost);
        const diagnostics = [...program.getSyntacticDiagnostics(), ...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics(), ...program.getSemanticDiagnostics() ];

        if (diagnostics.length > 0) {
            return { diagnostics, exitStatus: ts.ExitStatus.DiagnosticsPresent_OutputsSkipped };
        }

        const context = new llvm.LLVMContext();
        const llvmEmitter = new PerFileCodeGenerator(context, new DefaultCodeGenerationContextFactory(new NotYetImplementedCodeGenerator()));

        const logUnknownVisitor = new LogUnknownTransformVisitor();
        const builtIns = BuiltInSymbols.create(program, this.compilerHost, this.compilerOptions);
        const compilationContext: CompilationContext = {
            builtIns,
            compilerHost: this.compilerHost,
            compilerOptions: this.compilerOptions,
            llvmContext: context,
            program,
            rootDir: (program as any).getCommonSourceDirectory()
    };

        const speedyJSVisitor = new SpeedyJSTransformVisitor(compilationContext, llvmEmitter);

        try {
            const emitResult = program.emit(undefined, undefined, undefined, undefined, { before: [
                createTransformVisitorFactory(logUnknownVisitor),
                createTransformVisitorFactory(speedyJSVisitor)
            ]});

            llvmEmitter.write();

            const exitStatus = emitResult.emitSkipped ? ts.ExitStatus.DiagnosticsPresent_OutputsSkipped : ts.ExitStatus.Success;
            LOG("Program compiled");

            return { exitStatus, diagnostics: emitResult.diagnostics };
        } catch (ex) {
            if (ex instanceof CodeGenerationError) {
                return { exitStatus: ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics: [ ex.toDiagnostic() ]};
            } else {
                LOG(`Compilation failed`, ex);
                throw ex;
            }
        }
    }
}

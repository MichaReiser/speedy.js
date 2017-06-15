import * as debug from "debug";
import * as llvm from "llvm-node";
import * as ts from "typescript";
import {BuiltInSymbols} from "./built-in-symbols";
import {CodeGenerationDiagnostics, isCodeGenerationDiagnostic} from "./code-generation-diagnostic";
import {DefaultCodeGenerationContextFactory} from "./code-generation/default-code-generation-context-factory";
import {NotYetImplementedCodeGenerator} from "./code-generation/not-yet-implemented-code-generator";
import {PerFileCodeGenerator} from "./code-generation/per-file/per-file-code-generator";
import {CompilationContext} from "./compilation-context";
import {SpeedyJSCompilerOptions} from "./speedyjs-compiler-options";
import {LogUnknownTransformVisitor} from "./transform/log-unknown-transform-visitor";
import {SpeedyJSTransformVisitor} from "./transform/speedyjs-transform-visitor";
import {createTransformVisitorFactory} from "./transform/transform-visitor";
import {TypeScriptTypeChecker} from "./typescript-type-checker";

const LOG = debug("compiler");

/**
 * The main Interface for compiling a SpeedyJS Program.
 * The compiler creates compiles all with "use speedyjs" marked functions and rewrites the original source file
 * to invoke the web assembly function instead of executing the function body in the JS runtime.
 */
export class Compiler {
    /**
     * Creates a new instance that uses the given compilation options and compiler host
     * @param compilerOptions the compilation options
     * @param compilerHost the compiler host
     */
    constructor(private compilerOptions: SpeedyJSCompilerOptions, private compilerHost: ts.CompilerHost) {
    }

    /**
     * Compiles the source files with the given names
     * @param rootFileNames the file names of the source files to compile
     * @return the result of the compilation.
     */
    compile(rootFileNames: string[]): { exitStatus: ts.ExitStatus, diagnostics: ts.Diagnostic[] } {
        LOG("Start Compiling");
        Compiler.initLLVM();
        const program: ts.Program = ts.createProgram(rootFileNames, this.compilerOptions, this.compilerHost);
        const diagnostics = [
            ...program.getSyntacticDiagnostics(),
            ...program.getOptionsDiagnostics(),
            ...program.getGlobalDiagnostics(),
            ...program.getSemanticDiagnostics()
        ];

        if (diagnostics.length > 0) {
            return { diagnostics, exitStatus: ts.ExitStatus.DiagnosticsPresent_OutputsSkipped };
        }

        const context = new llvm.LLVMContext();
        const builtIns = BuiltInSymbols.create(program, this.compilerHost);
        const compilationContext: CompilationContext = {
            builtIns,
            compilerHost: this.compilerHost,
            compilerOptions: this.compilerOptions,
            llvmContext: context,
            typeChecker: new TypeScriptTypeChecker(program.getTypeChecker()),
            rootDir: (program as any).getCommonSourceDirectory()
        };

        return Compiler.emit(program, compilationContext);
    }

    private static initLLVM() {
        llvm.initializeAllTargets();
        llvm.initializeAllTargetInfos();
        llvm.initializeAllAsmPrinters();
        llvm.initializeAllTargetMCs();
        llvm.initializeAllAsmParsers();
    }

    private static emit(program: ts.Program, compilationContext: CompilationContext) {
        const codeGenerationContextFactory = new DefaultCodeGenerationContextFactory(new NotYetImplementedCodeGenerator());
        const codeGenerator = new PerFileCodeGenerator(compilationContext.llvmContext, codeGenerationContextFactory);

        const logUnknownVisitor = new LogUnknownTransformVisitor();
        const speedyJSVisitor = new SpeedyJSTransformVisitor(compilationContext, codeGenerator);

        try {
            const emitResult = program.emit(undefined, undefined, undefined, undefined, { before: [
                createTransformVisitorFactory(logUnknownVisitor),
                createTransformVisitorFactory(speedyJSVisitor)
            ]});

            let exitStatus;
            if (emitResult.emitSkipped) {
                exitStatus = ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
            } else {
                codeGenerator.completeCompilation();
                exitStatus = ts.ExitStatus.Success;
            }

            LOG("Program compiled");

            return { exitStatus, diagnostics: emitResult.diagnostics };
        } catch (ex) {
            if (isCodeGenerationDiagnostic(ex)) {
                return { exitStatus: ts.ExitStatus.DiagnosticsPresent_OutputsSkipped, diagnostics: [ CodeGenerationDiagnostics.toDiagnostic(ex) ]};
            } else {
                LOG(`Compilation failed`, ex);
                throw ex;
            }
        }
    }
}

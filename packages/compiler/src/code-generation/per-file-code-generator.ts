import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as path from "path";

import {CodeGenerator} from "./code-generator";
import {DefaultCodeGenerationContextFactory} from "./default-code-generation-context-factory";
import {CodeGenerationContext} from "./code-generation-context";
import {LLVMLink} from "../external-tools/llvm-link";
import {optimize} from "../external-tools/llvm-opt";
import {llc} from "../external-tools/llvm-llc";
import {s2wasm} from "../external-tools/binaryen-s2wasm";
import {wasmAs} from "../external-tools/binaryen-wasm-as";
import {BuildDirectory} from "./build-directory";
import {wasmOpt} from "../external-tools/binaryen-opt";
import {CompilationContext} from "../compilation-context";

const WASM_TRIPLE = "wasm32-unknown-unknown";

export class PerFileCodeGenerator implements CodeGenerator {
    private codeGenerationContexts = new Map<ts.SourceFile, CodeGenerationContext>();

    constructor(private context: llvm.LLVMContext, private codeGenerationContextFactory = new DefaultCodeGenerationContextFactory()) {

    }

    generateEntryFunction(fn: ts.FunctionDeclaration, compilationContext: CompilationContext) {
        const context = this.getCodeGenerationContext(fn, compilationContext);

        context.generateVoid(fn);
        context.addEntryFunction(fn.name!.text); // TODO function declaration without name?
    }

    write() {
        for (const [sourceFile, context] of Array.from(this.codeGenerationContexts.entries())) {
            llvm.verifyModule(context.module);
            if (context.module.empty) {
                continue;
            }

            const buildDirectory = BuildDirectory.createTempBuildDirectory();
            const plainFileName = path.basename(sourceFile.fileName.replace(".ts", ""));

            if (context.options.emitLLVM) {
                const llc = context.module.print();
                context.compilationContext.compilerHost.writeFile(this.getOutputFileName(sourceFile, context, ".ll"), llc, false);
            } else {
                const biteCodeFileName = buildDirectory.getTempFileName(`${plainFileName}.o`);
                llvm.writeBitcodeToFile(context.module, biteCodeFileName);
                const entryFunctions = context.getEntryFunctionNames();
                const linked = this.link(biteCodeFileName, buildDirectory.getTempFileName(`${plainFileName}-linked.o`), buildDirectory, context);
                const optimized = optimize(linked, entryFunctions, buildDirectory.getTempFileName(`${plainFileName}-opt.o`));

                const assembly = llc(optimized, buildDirectory.getTempFileName(`${plainFileName}.s`));
                const wast = s2wasm(assembly, buildDirectory.getTempFileName(`${plainFileName}.wast`));

                const wasmFileName = this.getOutputFileName(sourceFile, context);
                if (context.options.wasmOpt) {
                    wasmOpt(wast, wasmFileName);
                } else {
                    wasmAs(wast, wasmFileName);
                }
            }

            //

            /** .cpp.o files extracted from libcxxa */
            // c++
            // child_process.execSync(`llvm-link ${oFileName} '${runtimeBCFile}' -o ${bcFileName} '/Users/micha/.emscripten_cache/wasm/libc.bc' '/Users/micha/.emscripten_cache/wasm/dlmalloc.bc' '/Users/micha/.emscripten_cache/wasm/wasm-libc.bc' '/Users/micha/.emscripten_cache/wasm/libcxx/locale_f4231af9.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/memory_94d0033a.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/mutex_4dfab851.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/new_ac351dc4.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/stdexcept_10f6f70f.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/string_c368c26d.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/system_error_7474feb6.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/condition_variable_74a5d15a.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/ios_2dc9ca0b.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/thread_f7ffe72e.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/future_d543f9db.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/exception_a86a4271.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxxabi.bc'`);
            // child_process.execSync(`llvm-link ${oFileName} '${runtimeBCFile}' -o ${bcFileName} '/Users/micha/.emscripten_cache/wasm/libc.bc' '/Users/micha/.emscripten_cache/wasm/dlmalloc.bc' '/Users/micha/.emscripten_cache/wasm/wasm-libc.bc' '/Users/micha/.emscripten_cache/wasm/libcxx/locale_f4231af9.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/memory_94d0033a.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/mutex_4dfab851.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/new_ac351dc4.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/stdexcept_10f6f70f.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/string_c368c26d.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/system_error_7474feb6.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/condition_variable_74a5d15a.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/exception_a86a4271.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxxabi.bc'`);
            // child_process.execSync(`llvm-link ${oFileName} '${runtimeBCFile}' -o ${bcFileName} '/Users/micha/.emscripten_cache/wasm/libc.bc' '/Users/micha/.emscripten_cache/wasm/dlmalloc.bc' '/Users/micha/.emscripten_cache/wasm/wasm-libc.bc' '/Users/micha/.emscripten_cache/wasm/libcxx/new_f9ca4a31.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxx/stdexcept_7cc53a40.cpp.o' '/Users/micha/.emscripten_cache/wasm/libcxxabi.bc'`);
            // c
            // child_process.execSync(`llvm-link ${oFileName} -o ${bcFileName} '/Users/micha/.emscripten_cache/wasm/libc.bc' '/Users/micha/.emscripten_cache/wasm/dlmalloc.bc' '/Users/micha/.emscripten_cache/wasm/wasm-libc.bc' '${runtimeBCFile}'`);
            // child_process.execSync(`opt ${bcFileName} -o ${bcFileName} -strip-debug -disable-verify -internalize -internalize-public-api-list=nsieve,isPrime,fib,malloc,free,__errno_location,memcpy,memmove,memset,__cxa_can_catch,__cxa_is_pointer_type  -globaldce -disable-loop-vectorization -disable-slp-vectorization -vectorize-loops=false -vectorize-slp=false -vectorize-slp-aggressive=false -O3`);
            // child_process.execSync(`llc ${bcFileName} -march=wasm32 -filetype=asm -asm-verbose=false -thread-model=single -combiner-global-alias-analysis=false -enable-emscripten-cxx-exceptions -enable-emscripten-sjlj -o ${sFileName} `);

            buildDirectory.remove();
        }
    }

    private getOutputFileName(sourceFile: ts.SourceFile, context: CodeGenerationContext, fileExtension=".wasm") {
        const withNewExtension = sourceFile.fileName.replace(".ts", fileExtension);
        if (context.compilationContext.compilerOptions.outDir) {
            const relativeName = path.relative(context.compilationContext.compilerHost.getCurrentDirectory(), withNewExtension);
            return path.join(context.compilationContext.compilerOptions.outDir, relativeName);
        }

        return withNewExtension;
    }

    private link(file: string, linkedFileName: string, buildDirectory: BuildDirectory, context: CodeGenerationContext): string {
        const llvmLinker = new LLVMLink(buildDirectory);

        llvmLinker.addByteCodeFile(file);
        llvmLinker.addRuntime(context.options.unsafe);
        llvmLinker.addSharedLibraries();

        return llvmLinker.link(linkedFileName, context.getEntryFunctionNames());
    }

    dump() {
        for (const context of Array.from(this.codeGenerationContexts.values())) {
            context.module.dump();
        }
    }

    getCodeGenerationContext(node: ts.Node, compilationContext: CompilationContext): CodeGenerationContext {
        const sourceFile = node.getSourceFile();
        let codeGenerationContext = this.codeGenerationContexts.get(sourceFile);

        if (!codeGenerationContext) {
            codeGenerationContext = this.createContext(sourceFile, compilationContext);
            this.codeGenerationContexts.set(sourceFile, codeGenerationContext);
        }

        return codeGenerationContext!;
    }

    private createContext(sourceFile: ts.SourceFile, compilationContext: CompilationContext): CodeGenerationContext {
        const relativePath = path.relative(compilationContext.compilerHost.getCurrentDirectory(), sourceFile.fileName);
        const module = new llvm.Module(sourceFile.moduleName || relativePath, this.context);
        module.sourceFileName = relativePath;

        const target = llvm.TargetRegistry.lookupTarget(WASM_TRIPLE);
        const targetMachine = target.createTargetMachine(WASM_TRIPLE, "generic");
        module.dataLayout = targetMachine.createDataLayout();
        module.targetTriple = WASM_TRIPLE;

        return this.codeGenerationContextFactory.createContext(compilationContext, module);
    }

}

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

const WASM_TRIPLE = "wasm32-unknown-unknown";

export class PerFileCodeGenerator implements CodeGenerator {
    private codeGenerationContexts = new Map<ts.SourceFile, CodeGenerationContext>();

    constructor(private context: llvm.LLVMContext, private llvmEmitterContextFactory = new DefaultCodeGenerationContextFactory()) {

    }

    generate(node: ts.Node, program: ts.Program) {
        this.getCodeGenerationContext(node, program).generateVoid(node);
    }

    write() {
        for (const [sourceFile, context] of Array.from(this.codeGenerationContexts.entries())) {
            llvm.verifyModule(context.module);

            if (!context.module.empty) {
                const buildDirectory = BuildDirectory.createTempBuildDirectory();

                const plainFileName = path.basename(sourceFile.fileName.replace(".ts", ""));

                const compiledFileName = buildDirectory.getTempFileName(`${plainFileName}.o`);
                llvm.writeBitcodeToFile(context.module, compiledFileName);

                const linked = this.link(compiledFileName, buildDirectory.getTempFileName(`${plainFileName}-linked.o`), buildDirectory);
                const optimized = optimize(linked, ["fib", "isPrime", "nsieve"], buildDirectory.getTempFileName(`${plainFileName}-opt.o`));
                const assembly = llc(optimized, buildDirectory.getTempFileName(`${plainFileName}.s`));
                const wast = s2wasm(assembly, buildDirectory.getTempFileName(`${plainFileName}.wast`));

                wasmAs(wast, sourceFile.fileName.replace(".ts", ".wasm"));

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
    }

    private link(file: string, linkedFileName: string, buildDirectory: BuildDirectory): string {
        const llvmLinker = new LLVMLink(buildDirectory);

        llvmLinker.addByteCodeFile(file);
        llvmLinker.addRuntime();

        llvmLinker.link(linkedFileName, ["fib", "isPrime", "nsieve"]);
        return linkedFileName;
    }

    dump() {
        for (const context of Array.from(this.codeGenerationContexts.values())) {
            context.module.dump();
        }
    }

    getCodeGenerationContext(node: ts.Node, program: ts.Program): CodeGenerationContext {
        const sourceFile = node.getSourceFile();
        let codeGenerationContext = this.codeGenerationContexts.get(sourceFile);

        if (!codeGenerationContext) {
            const module = new llvm.Module(sourceFile.moduleName || sourceFile.fileName, this.context);
            module.sourceFileName = sourceFile.fileName;

            const target = llvm.TargetRegistry.lookupTarget(WASM_TRIPLE);
            const targetMachine = target.createTargetMachine(WASM_TRIPLE, "generic");
            module.dataLayout = targetMachine.createDataLayout();
            module.targetTriple = WASM_TRIPLE;

            codeGenerationContext = this.llvmEmitterContextFactory.createContext(program, this.context, module);
            this.codeGenerationContexts.set(sourceFile, codeGenerationContext);
        }

        return codeGenerationContext!;
    }

}

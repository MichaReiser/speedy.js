import * as assert from "assert";
import * as debug from "debug";
import * as fs from "fs";
import * as llvm from "llvm-node";
import * as path from "path";
import * as ts from "typescript";

import {CompilationContext} from "../../compilation-context";
import {wasmOpt} from "../../external-tools/binaryen-opt";
import {s2wasm} from "../../external-tools/binaryen-s2wasm";
import {wasmAs} from "../../external-tools/binaryen-wasm-as";
import {LLVMLink} from "../../external-tools/llvm-link";
import {llc} from "../../external-tools/llvm-llc";
import {optimize} from "../../external-tools/llvm-opt";
import {BuildDirectory} from "../build-directory";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerator} from "../code-generator";
import {DefaultCodeGenerationContextFactory} from "../default-code-generation-context-factory";
import {FunctionBuilder} from "../util/function-builder";
import {createResolvedFunctionFromSignature} from "../value/resolved-function";
import {LLVMEmitSourceFileRewriter} from "./llvm-emit-source-file-rewriter";
import {PerFileCodeGeneratorSourceFileRewriter} from "./per-file-code-generator-source-file-rewriter";
import {PerFileSourceFileRewirter} from "./per-file-source-file-rewriter";
import {WastMetaData} from "./wast-meta-data";

const WASM_TRIPLE = "wasm32-unknown-unknown";
const LOG = debug("code-generation/per-file-code-generator");

interface SourceFileState {
    context: CodeGenerationContext;
    sourceFileRewriter: PerFileSourceFileRewirter;
    requestEmitHelper: (emitHelper: ts.EmitHelper) => void;
}

/**
 * Code Generator that creates a dedicate WASM Module for each source file
 */
export class PerFileCodeGenerator implements CodeGenerator {
    private sourceFileStates = new Map<string, SourceFileState>();

    constructor(private context: llvm.LLVMContext, private codeGenerationContextFactory = new DefaultCodeGenerationContextFactory()) {
    }

    beginSourceFile(sourceFile: ts.SourceFile, compilationContext: CompilationContext, requestEmitHelper: (emitHelper: ts.EmitHelper) => void) {
        const context = this.createContext(sourceFile, compilationContext);
        this.sourceFileStates.set(sourceFile.fileName, {
            context,
            requestEmitHelper,
            sourceFileRewriter: compilationContext.compilerOptions.emitLLVM ? new LLVMEmitSourceFileRewriter() : new PerFileCodeGeneratorSourceFileRewriter(context.typeChecker, compilationContext.compilerOptions)
        });
    }

    generateEntryFunction(functionDeclaration: ts.FunctionDeclaration): ts.FunctionDeclaration {
        const state = this.getSourceFileState(functionDeclaration);
        const context = state.context;

        // function is async, therefore, return type is a promise of T. We compile it down to a function just returning T
        const signature = context.typeChecker.getSignatureFromDeclaration(functionDeclaration);
        const resolvedFunction = createResolvedFunctionFromSignature(signature, context.compilationContext);
        const mangledName = `_${resolvedFunction.functionName}`;
        const builder = FunctionBuilder.create(resolvedFunction, context)
            .name(mangledName)
            .externalLinkage();

        builder.define(functionDeclaration);
        context.addEntryFunction(mangledName);

        return state.sourceFileRewriter.rewriteEntryFunction(mangledName, functionDeclaration, state.requestEmitHelper);
    }

    completeSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
        const state = this.getSourceFileState(sourceFile);
        const context = state.context;

        if (context.module.empty) {
            return sourceFile;
        }

        if (context.requiresGc) {
            context.module.getOrInsertFunction("speedyJsGc", llvm.FunctionType.get(llvm.Type.getVoidTy(context.llvmContext), [], false));
        }

        LOG(`Emit module for source file ${sourceFile.fileName}.`);
        llvm.verifyModule(context.module);
        this.writeModule(sourceFile, state);
        LOG(`Module for source file ${sourceFile.fileName} emitted.`);

        return state.sourceFileRewriter.rewriteSourceFile(sourceFile, state.requestEmitHelper);
    }

    completeCompilation() {
        this.sourceFileStates.clear();
    }

    private writeModule(sourceFile: ts.SourceFile, state: SourceFileState) {
        const context = state.context;
        const buildDirectory = BuildDirectory.createTempBuildDirectory();
        const plainFileName = path.basename(sourceFile.fileName.replace(".ts", ""));

        if (context.compilationContext.compilerOptions.emitLLVM) {
            const llc = context.module.print();
            context.compilationContext.compilerHost.writeFile(this.getOutputFileName(sourceFile, context, ".ll"), llc, false);
        } else {
            const biteCodeFileName = buildDirectory.getTempFileName(`${plainFileName}.o`);
            llvm.writeBitcodeToFile(context.module, biteCodeFileName);

            const entryFunctions = context.getEntryFunctionNames();
            const linked = this.link(biteCodeFileName, buildDirectory.getTempFileName(`${plainFileName}-linked.o`), buildDirectory, context);
            const linkedOptimized = optimize(linked, entryFunctions, buildDirectory.getTempFileName(`${plainFileName}-lopt.o`), context.compilationContext.compilerOptions.optimizationLevel);

            const assembly = llc(linkedOptimized, buildDirectory.getTempFileName(`${plainFileName}.s`));
            const wast = s2wasm(assembly, buildDirectory.getTempFileName(`${plainFileName}.wast`), context.compilationContext.compilerOptions);

            const wasmFileName = buildDirectory.getTempFileName(`${plainFileName}.wasm`);
            if (context.compilationContext.compilerOptions.binaryenOpt) {
                wasmOpt(wast, wasmFileName);
            } else {
                wasmAs(wast, wasmFileName);
            }

            const glue = this.getGlueMetadata(wast);
            const buffer = fs.readFileSync(wasmFileName);
            state.sourceFileRewriter.setWasmOutput(buffer, glue);
        }

        buildDirectory.remove();
    }

    private getOutputFileName(sourceFile: ts.SourceFile, context: CodeGenerationContext, fileExtension=".wasm") {
        const withNewExtension = sourceFile.fileName.replace(".ts", fileExtension);
        if (context.compilationContext.compilerOptions.outDir) {
            const relativeName = path.relative(context.compilationContext.rootDir, withNewExtension);
            return path.join(context.compilationContext.compilerOptions.outDir, relativeName);
        }

        return withNewExtension;
    }

    private link(file: string, linkedFileName: string, buildDirectory: BuildDirectory, context: CodeGenerationContext): string {
        const llvmLinker = new LLVMLink(buildDirectory);

        llvmLinker.addByteCodeFile(file);
        llvmLinker.addRuntime(context.compilationContext.compilerOptions.unsafe);

        return llvmLinker.link(linkedFileName, context.getEntryFunctionNames());
    }

    // glue code https://github.com/kripken/emscripten/blob/5387c1e5f1f55b69c41b94cf044062c59e052f0b/emscripten.py#L1415
    private getGlueMetadata(wastFileName: string): WastMetaData {
        const wastContent = ts.sys.readFile(wastFileName);
        const parts = wastContent.split("\n;; METADATA:");

        const metaDataRaw = parts[1];
        return JSON.parse(metaDataRaw);
    }

    dump() {
        for (const states of Array.from(this.sourceFileStates.values())) {
            states.context.module.dump();
        }
    }

    private getSourceFileState(node: ts.Node): SourceFileState {
        const sourceFile = node.getSourceFile();
        const state = this.sourceFileStates.get(sourceFile.fileName);

        assert(state, `First call beginSourceFile before calling any other functions on the code generator (state missing for source file ${sourceFile.fileName}).`);

        return state!;
    }

    private createContext(sourceFile: ts.SourceFile, compilationContext: CompilationContext): CodeGenerationContext {
        const relativePath = path.relative(compilationContext.rootDir, sourceFile.fileName);
        const module = new llvm.Module(sourceFile.moduleName || relativePath, this.context);
        module.sourceFileName = relativePath;

        const target = llvm.TargetRegistry.lookupTarget(WASM_TRIPLE);
        const targetMachine = target.createTargetMachine(WASM_TRIPLE, "generic");
        module.dataLayout = targetMachine.createDataLayout();
        module.targetTriple = WASM_TRIPLE;

        return this.codeGenerationContextFactory.createContext(compilationContext, module);
    }
}

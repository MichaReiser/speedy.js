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
import {optimize, optimizeLinked} from "../../external-tools/llvm-opt";
import {BuildDirectory} from "../build-directory";
import {CodeGenerationContext} from "../code-generation-context";
import {CodeGenerator} from "../code-generator";
import {DefaultCodeGenerationContextFactory} from "../default-code-generation-context-factory";
import {FunctionBuilder} from "../util/function-builder";
import {createResolvedFunctionFromSignature} from "../value/resolved-function";
import {NoopSourceFileRewriter} from "./llvm-emit-source-file-rewriter";
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
        const emitsWasm = !compilationContext.compilerOptions.emitLLVM;
        this.sourceFileStates.set(sourceFile.fileName, {
            context,
            requestEmitHelper,
            sourceFileRewriter: emitsWasm ? new PerFileCodeGeneratorSourceFileRewriter(context) : new NoopSourceFileRewriter()
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

        builder.define(resolvedFunction.definition!);
        context.addEntryFunction(mangledName);

        return state.sourceFileRewriter.rewriteEntryFunction(mangledName, functionDeclaration, state.requestEmitHelper);
    }

    completeSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
        const state = this.getSourceFileState(sourceFile);
        const context = state.context;

        if (context.module.empty || context.getEntryFunctionNames().length === 0) {
            return sourceFile;
        }

        if (context.requiresGc) {
            context.module.getOrInsertFunction("speedyJsGc", llvm.FunctionType.get(llvm.Type.getVoidTy(context.llvmContext), [], false));
        }

        LOG(`Emit module for source file ${sourceFile.fileName}.`);
        // llvm.verifyModule(context.module);
        this .writeModule(sourceFile, state);
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
            context.compilationContext.compilerHost.writeFile(getOutputFileName(sourceFile, context, ".ll"), llc, false);
        } else {
            const transforms = PerFileCodeGenerator.createTransformationChain(context);
            const transformationContext = {
                sourceFile,
                codeGenerationContext: context,
                buildDirectory,
                plainFileName,
                sourceFileRewriter: state.sourceFileRewriter
            };

            const biteCodeFileName = buildDirectory.getTempFileName(`${plainFileName}.bc`);
            llvm.writeBitcodeToFile(context.module, biteCodeFileName);

            transforms.reduce((inputFileName, transformation) => transformation.transform(inputFileName, transformationContext), biteCodeFileName);
        }

        buildDirectory.remove();
    }

    private static createTransformationChain(context: CodeGenerationContext) {
        const optimizationLevel = context.compilationContext.compilerOptions.optimizationLevel;

        const transforms: TransformationStep[] = [
            LinkTransformationStep.createRuntimeLinking()
        ];

        if (optimizationLevel !== "0") {
            transforms.push(new OptimizationTransformationStep());
        }

        transforms.push(
            LinkTransformationStep.createSharedLibsLinking(),
            new LinkTimeOptimizationTransformationStep());

        if (context.compilationContext.compilerOptions.saveBc) {
            transforms.push(new CopyFileToOutputDirectoryTransformationStep(".bc", true));
        }

        transforms.push(
            new LLCTransformationStep(),
            new S2WasmTransformationStep()
        );

        if (context.compilationContext.compilerOptions.binaryenOpt && optimizationLevel !== "0") {
            transforms.push(new BinaryenOptTransformationStep());
        }

        if (context.compilationContext.compilerOptions.saveWast) {
            transforms.push(new CopyFileToOutputDirectoryTransformationStep(".wast"));
        }

        transforms.push(new WasmToAsTransformationStep());

        return transforms;
    }

    private getSourceFileState(node: ts.Node): SourceFileState {
        const sourceFile = node.getSourceFile();
        const state = this.sourceFileStates.get(sourceFile.fileName);

        // tslint:disable-next-line:max-line-length
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

interface TransformationContext {
    plainFileName: string;
    buildDirectory: BuildDirectory;
    sourceFile: ts.SourceFile;
    codeGenerationContext: CodeGenerationContext;
    sourceFileRewriter: PerFileSourceFileRewirter;
}

interface TransformationStep {
    /**
     * Performs the transformation
     * @param inputFileName the input file name
     * @return the name of the output file name
     */
    transform(inputFileName: string, transformationContext: TransformationContext): string;
}

class OptimizationTransformationStep implements TransformationStep {
    transform(inputFileName: string, {plainFileName, buildDirectory, codeGenerationContext}: TransformationContext): string {
        const optimizedFileName = buildDirectory.getTempFileName(`${plainFileName}-opt.bc`);
        const optimizationLevel = codeGenerationContext.compilationContext.compilerOptions.optimizationLevel;

        return optimize(inputFileName, optimizedFileName, optimizationLevel);
    }
}

class LinkTransformationStep implements TransformationStep {

    static createRuntimeLinking() {
        return new LinkTransformationStep(true);
    }

    static createSharedLibsLinking() {
        return new LinkTransformationStep(false);
    }

    private constructor(private runtime: boolean) {

    }

    transform(inputFileName: string, {plainFileName, buildDirectory, codeGenerationContext}: TransformationContext): string {
        const llvmLinker = new LLVMLink(buildDirectory);
        const entryFunctions = codeGenerationContext.getEntryFunctionNames();

        llvmLinker.addByteCodeFile(inputFileName);

        if (this.runtime) {
            llvmLinker.addRuntime(codeGenerationContext.compilationContext.compilerOptions.unsafe);
        } else {
            llvmLinker.addSharedLibs();
        }

        return llvmLinker.link(buildDirectory.getTempFileName(`${plainFileName}-linked.o`), entryFunctions);
    }
}

class LinkTimeOptimizationTransformationStep implements TransformationStep {
    transform(inputFileName: string, {plainFileName, buildDirectory, codeGenerationContext}: TransformationContext): string {
        const optimizedFileName = buildDirectory.getTempFileName(`${plainFileName}-lopt.bc`);
        const entryFunctionNames = codeGenerationContext.getEntryFunctionNames();

        return optimizeLinked(inputFileName, entryFunctionNames, optimizedFileName, codeGenerationContext.compilationContext.compilerOptions.optimizationLevel);
    }
}

class CopyFileToOutputDirectoryTransformationStep implements TransformationStep {
    constructor(private extension: string, private binary = false) {}

    transform(inputFileName: string, {plainFileName, buildDirectory, sourceFile, codeGenerationContext}: TransformationContext): string {
        const outputFileName = getOutputFileName(sourceFile, codeGenerationContext, this.extension);

        if (this.binary) {
            // ts writeFile seems not to support binary output, therefore use fs directly
            fs.writeFileSync(outputFileName, fs.readFileSync(inputFileName));
        } else {
            // has the advantage that it can be intercepted by the in memory compiler
            codeGenerationContext.compilationContext.compilerHost.writeFile(outputFileName, ts.sys.readFile(inputFileName), false);
        }
        return inputFileName;
    }
}

class LLCTransformationStep implements TransformationStep {
    transform(inputFileName: string, { plainFileName, buildDirectory }: TransformationContext): string {
        return llc(inputFileName, buildDirectory.getTempFileName(`${plainFileName}.s`));
    }
}

class S2WasmTransformationStep implements TransformationStep {
    transform(inputFileName: string, {buildDirectory, plainFileName, codeGenerationContext, sourceFileRewriter}: TransformationContext): string {
        const compilerOptions = codeGenerationContext.compilationContext.compilerOptions;
        const wastFileName = s2wasm(inputFileName, buildDirectory.getTempFileName(`${plainFileName}.wast`), compilerOptions);
        const glue = S2WasmTransformationStep.getGlueMetadata(wastFileName);
        sourceFileRewriter.setWastMetaData(glue);
        return wastFileName;
    }

    // glue code https://github.com/kripken/emscripten/blob/5387c1e5f1f55b69c41b94cf044062c59e052f0b/emscripten.py#L1415
    private static getGlueMetadata(wastFileName: string): WastMetaData {
        const wastContent = ts.sys.readFile(wastFileName);
        const parts = wastContent.split("\n;; METADATA:");

        const metaDataRaw = parts[1];
        return JSON.parse(metaDataRaw);
    }
}

class BinaryenOptTransformationStep implements TransformationStep {
    transform(inputFileName: string, { buildDirectory, plainFileName, codeGenerationContext }: TransformationContext): string {
        const outputFile = buildDirectory.getTempFileName(`${plainFileName}-opt.wast`);
        return wasmOpt(inputFileName, outputFile);
    }
}

class WasmToAsTransformationStep implements TransformationStep {
    transform(inputFileName: string, { buildDirectory, plainFileName, sourceFileRewriter, sourceFile, codeGenerationContext}: TransformationContext): string {
        const wasmFileName = buildDirectory.getTempFileName(`${plainFileName}.wasm`);
        wasmAs(inputFileName, wasmFileName);

        const wasmFileWriter = codeGenerationContext.compilationContext.compilerOptions.wasmFileWriter;
        const finalWasmFileName = getOutputFileName(sourceFile, codeGenerationContext);
        const wasmFetchExpression = wasmFileWriter.writeWasmFile(finalWasmFileName, fs.readFileSync(wasmFileName), codeGenerationContext);
        sourceFileRewriter.setWasmUrl(wasmFetchExpression);

        return wasmFileName;
    }
}

function getOutputFileName(sourceFile: ts.SourceFile, context: CodeGenerationContext, fileExtension = ".wasm") {
    const withNewExtension = sourceFile.fileName.replace(".ts", fileExtension);
    if (context.compilationContext.compilerOptions.outDir) {
        const relativeName = path.relative(context.compilationContext.rootDir, withNewExtension);
        return path.join(context.compilationContext.compilerOptions.outDir, relativeName);
    }

    return withNewExtension;
}

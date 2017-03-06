import * as ts from "typescript";
import * as llvm from "llvm-node";
import * as child_process from "child_process";
import {CodeGenerator} from "./code-generator";
import {DefaultCodeGenerationContextFactory} from "./default-code-generation-context-factory";
import {CodeGenerationContext} from "./code-generation-context";

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
                const bcFileName = sourceFile.fileName.replace(".ts", ".bc");
                llvm.writeBitcodeToFile(context.module, bcFileName);
                const sFileName = bcFileName.replace(".bc", ".s");
                child_process.execSync(`opt -O3 ${bcFileName} -o ${bcFileName}`);
                child_process.execSync(`llc ${bcFileName} -o ${sFileName}`);
            }
        }
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
            const dataLayout = targetMachine.createDataLayout();
            module.setDataLayout(dataLayout);
            module.targetTriple = WASM_TRIPLE;

            codeGenerationContext = this.llvmEmitterContextFactory.createContext(program, this.context, module);
            this.codeGenerationContexts.set(sourceFile, codeGenerationContext);
        }

        return codeGenerationContext!;
    }

}

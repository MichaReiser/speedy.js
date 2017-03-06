#include <iostream>
#include <llvm/IR/Module.h>
#include <llvm/IR/LegacyPassManager.h>
#include <llvm/Support/TargetSelect.h>
#include <llvm/Support/TargetRegistry.h>
#include <llvm/Support/FileSystem.h>
#include <llvm/Bitcode/BitcodeWriter.h>
#include <llvm/Bitcode/BitcodeWriterPass.h>
#include <llvm/Target/TargetMachine.h>
#include <llvm/Passes/PassBuilder.h>
#include "code-generator.h"

int main() {
    llvm::LLVMContext context {};
    std::shared_ptr<llvm::Module> module = std::make_shared<llvm::Module>("fib.js", context);
    module->setSourceFileName("fib.js");

    llvm::InitializeAllTargetInfos();
    llvm::InitializeAllTargets();
    llvm::InitializeAllTargetMCs();
    llvm::InitializeAllAsmParsers();
    llvm::InitializeAllAsmPrinters();

    std::string error;
    auto targetTriple = "wasm32-unknown-unknown";
    // auto targetTriple = llvm::sys::getDefaultTargetTriple();

    auto target = llvm::TargetRegistry::lookupTarget(targetTriple, error);
    if (!target) {
        llvm::errs() << error;
        return 1;
    }

    auto cpu = "generic";

    llvm::TargetOptions options {};
    auto targetMachine = target->createTargetMachine(targetTriple, cpu, "", options, llvm::Optional<llvm::Reloc::Model> {});
    module->setDataLayout(targetMachine->createDataLayout());
    module->setTargetTriple(targetTriple);

    CodeGenerator generator { context, module };
    llvm::Value* value = generator.generate();

    llvm::legacy::PassManager passManager {};


    std::error_code errorCode;
    llvm::raw_fd_ostream byteCodeFile { "output.bc", errorCode, llvm::sys::fs::F_None };

    if (errorCode) {
        llvm::errs() << "Could not open file: " << errorCode.message();
        return 1;
    }

    llvm::WriteBitcodeToFile(module.get(), byteCodeFile);

    passManager.run(*module);

    std::cout << "Hello, World!" << std::endl;
    return 0;
}
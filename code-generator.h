//
// Created by Micha Reiser on 23.02.17.
//

#include <llvm/IR/Value.h>
#include <llvm/IR/IRBuilder.h>

#ifndef SPEEDYJS_CODE_GENERATOR_H
#define SPEEDYJS_CODE_GENERATOR_H

class CodeGenerator {
    llvm::LLVMContext& context;
    std::shared_ptr<llvm::Module> module;
    llvm::IRBuilder<> builder;
    std::map<std::string, llvm::Value*> scope;

    llvm::Function* defineFib();
    llvm::Function* declareFib();
    llvm::Value* fibBody(llvm::Function* function);
    llvm::Value *callFib(llvm::Value* current, double minus);

public:
    CodeGenerator(llvm::LLVMContext& context, std::shared_ptr<llvm::Module> module);

    llvm::Value* generate();

};

#endif //SPEEDYJS_CODE_GENERATOR_H

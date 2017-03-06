//
// Created by Micha Reiser on 23.02.17.
//

#include <vector>
#include <llvm/IR/Type.h>
#include <llvm/IR/Verifier.h>
#include "code-generator.h"

CodeGenerator::CodeGenerator(llvm::LLVMContext& context, std::shared_ptr<llvm::Module> module)
    : context { context }, module { module }, builder { context }, scope {} {
}

llvm::Value *CodeGenerator::generate() {
    std::vector<llvm::Type*> args { llvm::Type::getDoubleTy(context) };
    /*auto logType = llvm::FunctionType::get(llvm::Type::getVoidTy(context), args, false);
    auto log = llvm::Function::Create(logType, llvm::Function::ExternalLinkage, "log", module.get());
    */

    return this->defineFib();
}

llvm::Function *CodeGenerator::defineFib() {
    llvm::Function* function = this->declareFib();

    llvm::BasicBlock* functionBody = llvm::BasicBlock::Create(context, "entry", function);
    builder.SetInsertPoint(functionBody);

    auto result = this->fibBody(function);

    builder.CreateRet(result);
    llvm::verifyFunction(*function);

    return function;
}

llvm::Function* CodeGenerator::declareFib() {
    std::vector<llvm::Type*> argument { 1, llvm::Type::getDoubleTy(context) };
    llvm::FunctionType* functionType = llvm::FunctionType::get(llvm::Type::getDoubleTy(context), argument, false);
    llvm::Function* function = llvm::Function::Create(functionType, llvm::Function::ExternalLinkage, "fib", module.get());

    for (auto &arg : function->args()) {
        scope["number"] = &arg;
    }

    return function;
}

llvm::Value* CodeGenerator::fibBody(llvm::Function* function) {
    /* auto log = module->getFunction("log");
    std::vector<llvm::Value*> params { llvm::ConstantFP::get(context, llvm::APFloat { 10.0 }) };
    builder.CreateCall(log, params); */

    llvm::Value* number = scope["number"];
    llvm::Value* right = llvm::ConstantFP::get(context, llvm::APFloat { 1.0 });
    llvm::Value* comparisionResult = builder.CreateFCmpOLE(number, right, "<=");

    llvm::BasicBlock* thenBlock = llvm::BasicBlock::Create(context, "then", function);
    llvm::BasicBlock* elseBlock = llvm::BasicBlock::Create(context, "else");
    llvm::BasicBlock* successorBlock = llvm::BasicBlock::Create(context, "ifSuccessor");

    builder.CreateCondBr(comparisionResult, thenBlock, elseBlock);

    builder.SetInsertPoint(thenBlock);
    auto thenResult = llvm::ConstantFP::get(context, llvm::APFloat { 1.0 });
    builder.CreateBr(successorBlock);
    thenBlock = builder.GetInsertBlock();

    function->getBasicBlockList().push_back(elseBlock);
    builder.SetInsertPoint(elseBlock);
    auto firstCall = callFib(scope["number"], 1.0);
    auto secondCall = callFib(scope["number"], 2.0);

    auto elseResult = builder.CreateFAdd(firstCall, secondCall, "addition");
    builder.CreateBr(successorBlock);
    elseBlock = builder.GetInsertBlock();

    function->getBasicBlockList().push_back(successorBlock);
    builder.SetInsertPoint(successorBlock);
    llvm::PHINode* phiNode = builder.CreatePHI(llvm::Type::getDoubleTy(context), 2, "ifresult");

    phiNode->addIncoming(thenResult, thenBlock);
    phiNode->addIncoming(elseResult, elseBlock);

    return phiNode;
}

llvm::Value *CodeGenerator::callFib(llvm::Value* current, double minus) {
    auto function = module->getFunction("fib");

    auto lhs = current;
    auto rhs = llvm::ConstantFP::get(context, llvm::APFloat(minus));
    auto num = builder.CreateFSub(lhs, rhs, "subtmp");

    std::vector<llvm::Value*> args {};
    args.push_back(num);

    return builder.CreateCall(function, args, "fibResult");
}




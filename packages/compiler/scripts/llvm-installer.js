const fs = require("fs");
const path = require("path");
const dependencyUtils = require("./dependency-utils");

const LLVM_GIT_URL = "https://github.com/llvm-mirror/llvm.git";
const CLANG_GIT_URL = "https://github.com/llvm-mirror/clang.git";


function buildLLVM(directory) {
    console.log("Build LLVM");
    const llvmDirectory = path.join(directory, "llvm");
    const llvmBuildDirectory = path.join(llvmDirectory, "build");

    dependencyUtils.gitCloneOrPull(LLVM_GIT_URL, llvmDirectory);
    dependencyUtils.gitCloneOrPull(CLANG_GIT_URL, path.join(llvmDirectory, "tools/clang"));

    if (!fs.existsSync(llvmBuildDirectory)) {
        fs.mkdirSync(llvmBuildDirectory);
    }

    dependencyUtils.exec('cmake -E chdir %s cmake -DLLVM_TARGETS_TO_BUILD=X86 -DCMAKE_BUILD_TYPE=Debug -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF %s', llvmBuildDirectory, llvmDirectory);
    dependencyUtils.make(llvmBuildDirectory);

    return path.join(llvmBuildDirectory, "bin");
}

function install(directory) {
    if (process.env.LLVM) {
        return process.env.LLVM;
    }

    return buildLLVM(directory);
}

module.exports = { install: install };

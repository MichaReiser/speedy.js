const fs = require("fs");
const path = require("path");
const dependencyUtils = require("./dependency-utils");

const LLVM_GIT_URL = "https://github.com/llvm-mirror/llvm.git";
const CLANG_GIT_URL = "https://github.com/llvm-mirror/clang.git";


function buildLLVM(directory) {
    console.log("Build LLVM");
    const targetDirectory = path.join(directory, "llvm");
    const llvmDirectory = path.join(targetDirectory, "src");
    const llvmBuildDirectory = path.join(targetDirectory, "build");

    dependencyUtils.gitCloneOrPull(LLVM_GIT_URL, llvmDirectory);
    dependencyUtils.gitCloneOrPull(CLANG_GIT_URL, path.join(llvmDirectory, "tools/clang"));

    if (!fs.existsSync(llvmBuildDirectory)) {
        fs.mkdirSync(llvmBuildDirectory);
    }

    dependencyUtils.exec('cmake -E chdir %s cmake -DLLVM_TARGETS_TO_BUILD=X86 -DCMAKE_BUILD_TYPE=MinSizeRel -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=WebAssembly -DLLVM_INCLUDE_EXAMPLES=OFF -DLLVM_INCLUDE_TESTS=OFF -DCLANG_INCLUDE_TESTS=OFF -DLLVM_ENABLE_ASSERTIONS=ON -DCMAKE_INSTALL_PREFIX=%s %s', llvmBuildDirectory, targetDirectory, llvmDirectory);
    dependencyUtils.make(llvmBuildDirectory, true);

    return path.join(targetDirectory, "bin");
}

function install(directory) {
    let binDir;

    const configuredLLVM = process.env.LLVM_CONFIG || process.env.npm_config_LLVM_CONFIG;

    // Use version defined by environment variable
    if (configuredLLVM) {
        const builtTargets = dependencyUtils.execPiped("%s --targets-built", configuredLLVM);

        if (builtTargets.indexOf("WebAssembly") === -1) {
            throw new Error("LLVM config (" + configuredLLVM + ") reports that the WebAssembly target is missing (" + builtTargets.trim() +"). An LLVM installation with the WebAssembly target is required");
        }

        binDir = dependencyUtils.execPiped("%s --bindir", configuredLLVM).trim();
    } else {
        // no explicit llvm installation set, try default
        try {
            const builtTargets = dependencyUtils.execPiped("llvm-config --targets-built").trim();

            if (builtTargets.indexOf("WebAssembly") !== -1) {
                binDir = dependencyUtils.execPiped("llvm-config --bindir").trim();
            } else {
                console.warn("Default LLVM-Installation reports no WebAssembly backend (" + builtTargets + ") and is, therefore, not used.");
            }
        } catch (error) {
            console.warn("Failed to detect default llvm installation", error);
        }
    }

    // No installation provided and default did not work, so use custom build
    if (!binDir) {
        console.warn("Build LLVM with WebAssembly backend from source");
        binDir = buildLLVM(directory);
    }

    console.log("Use llvm installation located at '" + binDir + "'.")

    return binDir;
}

module.exports = { install: install };

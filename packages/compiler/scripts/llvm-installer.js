const fs = require("fs");
const path = require("path");
const dependencyUtils = require("./dependency-utils");

function install() {
    let llvmConfigPath;

    const configuredLLVM = process.env.LLVM_CONFIG || process.env.npm_config_LLVM_CONFIG;

    // Use version defined by environment variable
    if (configuredLLVM) {
        const builtTargets = dependencyUtils.execPiped("%s --targets-built", configuredLLVM);

        if (builtTargets.indexOf("WebAssembly") === -1) {
            throw new Error("LLVM config (" + configuredLLVM + ") reports that the WebAssembly target is missing (" + builtTargets.trim() +"). An LLVM installation with the WebAssembly target is required");
        }

        llvmConfigPath = configuredLLVM;
    } else {
        // no explicit llvm installation set, try default
        try {
            const builtTargets = dependencyUtils.execPiped("llvm-config --targets-built").trim();

            if (builtTargets.indexOf("WebAssembly") !== -1) {
                llvmConfigPath = "llvm-config";
            } else {
                console.warn("Default LLVM-Installation reports no WebAssembly backend (" + builtTargets + ") and is, therefore, not used.");
            }
        } catch (error) {
            console.warn("Failed to detect default llvm installation", error);
        }
    }

    // No installation provided and default did not work, so use custom build
    if (!llvmConfigPath) {
        throw new Error("No LLVM installation with built in WebAssembly backend found. Please build LLVM from source according to https://github.com/MichaReiser/speedy.js/blob/master/doc/BUILD_LLVM_FROM_SOURCE.md and set the LLVM_CONFIG variable to the llvm-config executable.");
    }

    console.log("Use llvm installation located at '" + llvmConfigPath + "'.");

    return llvmConfigPath;
}

module.exports = { install: install };

const path = require("path");
const fs = require("fs");
const llvmInstaller = require("./llvm-installer");
const binaryenInstaller = require("./binaryen-installer");

const TOOLS_DIRECTORY = path.resolve("./tools");

function build() {
    if (!fs.existsSync(TOOLS_DIRECTORY)) {
        fs.mkdirSync(TOOLS_DIRECTORY);
    }

    const llvm = llvmInstaller.install(TOOLS_DIRECTORY);
    const binaryen = binaryenInstaller.install(TOOLS_DIRECTORY);

    const configuration = {
        BINARYEN: binaryen,
        LLVM: llvm
    };

    console.log("speedyjs-runtime configuration", configuration);

    fs.writeFileSync(path.join(TOOLS_DIRECTORY, "configuration.json"), JSON.stringify(configuration, undefined, "\t"));

    // Set the environment variable for llvm-node
    if (!process.env.GYP_DEFINES) {
        const LLVM_CONFIG = path.join(configuration.LLVM, "llvm-config");
        process.env.GYP_DEFINES="LLVM_CONFIG=" + LLVM_CONFIG;
    }
}

build();

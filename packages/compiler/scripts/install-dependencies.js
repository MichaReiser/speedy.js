const path = require("path");
const fs = require("fs");
const llvmInstaller = require("./llvm-installer");
const binaryenInstaller = require("./binaryen-installer");

const TOOLS_DIRECTORY = "./tools";

function build() {
    if (!fs.existsSync(TOOLS_DIRECTORY)) {
        fs.mkdirSync(TOOLS_DIRECTORY);
    }

    const llvm = llvmInstaller.install();
    const binaryen = binaryenInstaller.install(TOOLS_DIRECTORY);

    const configuration = {
        BINARYEN: binaryen,
        LLVM: llvm
    };

    console.log("speedyjs-runtime configuration", configuration);

    fs.writeFileSync(path.join(TOOLS_DIRECTORY, "configuration.json"), JSON.stringify(configuration, undefined, "\t"));
}

build();

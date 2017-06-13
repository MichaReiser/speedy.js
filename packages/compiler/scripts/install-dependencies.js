const path = require("path");
const fs = require("fs");
const llvmInstaller = require("./llvm-installer");
const binaryenInstaller = require("./binaryen-installer");

const TOOLS_DIRECTORY = "./tools";

function build() {
    if (!fs.existsSync(TOOLS_DIRECTORY)) {
        fs.mkdirSync(TOOLS_DIRECTORY);
    }

    // The paths needs to be relative as npm install is run in a temporary directory that changes when the installation was successful.
    // relative paths are also useful on heroku where all dependencies need to be relative to the build directory
    const llvm = path.relative(process.cwd(), llvmInstaller.install());
    const binaryen = path.relative(process.cwd(), binaryenInstaller.install(TOOLS_DIRECTORY));

    const configuration = {
        BINARYEN: binaryen,
        LLVM: llvm
    };

    console.log("speedyjs-runtime configuration", configuration);

    fs.writeFileSync(path.join(TOOLS_DIRECTORY, "configuration.json"), JSON.stringify(configuration, undefined, "\t"));
}

build();

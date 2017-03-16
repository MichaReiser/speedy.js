const path = require("path");
const os = require("os");
const fs = require("fs");
const util = require("util");

const llvmInstaller = require("../../compiler/scripts/llvm-installer");
const binaryenInstaller = require("../../compiler/scripts/binaryen-installer");
const emscriptenInstaller = require("./emscripten-installer");

const TOOLS_DIRECTORY = path.resolve("./tools");
const COMPILER_TOOLS_DIRECTORY = path.resolve("../compiler/tools");

function build() {
    if (!fs.existsSync(TOOLS_DIRECTORY)) {
        fs.mkdirSync(TOOLS_DIRECTORY);
    }

    if (!fs.existsSync(COMPILER_TOOLS_DIRECTORY)) {
        fs.mkdirSync(COMPILER_TOOLS_DIRECTORY);
    }

    const llvm = llvmInstaller.install(COMPILER_TOOLS_DIRECTORY);
    const binaryen = binaryenInstaller.install(COMPILER_TOOLS_DIRECTORY);
    const emscripten = emscriptenInstaller.install(TOOLS_DIRECTORY);

    const configuration = util.format(
        "import os\nLLVM_ROOT='%s'\n" +
        "NODE_JS='node'\n" +
        "EMSCRIPTEN_ROOT='%s'\n" +
        "EMSCRIPTEN_NATIVE_OPTIMIZER='%s'\n" +
        "BINARYEN_ROOT='%s'\n" +
        "SPIDERMONKEY_ENGINE = ''\n" +
        "V8_ENGINE = ''\n" +
        "TEMP_DIR = '%s'\n" +
        "COMPILER_ENGINE = NODE_JS\n" +
        "JS_ENGINES = [NODE_JS]\n",
        llvm,
        emscripten,
        path.join(emscripten, "optimizer"),
        binaryen,
        os.tmpdir()
    );

    console.log("Emscripten Configuration:\n\n");
    console.log(configuration);

    fs.writeFileSync(path.resolve("./.emscripten"), configuration);
}

build();

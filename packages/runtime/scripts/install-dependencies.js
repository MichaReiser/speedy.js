const path = require("path");
const os = require("os");
const fs = require("fs");
const util = require("util");

const dependencyUtils = require("../../compiler/scripts/dependency-utils");
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

    const llvmConfig = llvmInstaller.install(COMPILER_TOOLS_DIRECTORY);
    const llvm = dependencyUtils.execPiped(llvmConfig + " --bindir").trim();

    const binaryen = binaryenInstaller.install(COMPILER_TOOLS_DIRECTORY);
    const emscripten = emscriptenInstaller.install(TOOLS_DIRECTORY);

    const configuration = util.format(
        "import os\n" +
        "NODE_JS = os.path.expanduser(os.getenv('NODE') or '/usr/local/bin/node') # executable\n" +
        "SPIDERMONKEY_ENGINE = [os.path.expanduser(os.getenv('SPIDERMONKEY') or 'js')] # executable\n" +
        "V8_ENGINE = os.path.expanduser(os.getenv('V8') or 'd8') # executable\n" +
        "LLVM_ROOT='%s'\n" +
        "EMSCRIPTEN_ROOT='%s'\n" +
        "BINARYEN_ROOT='%s'\n" +
        "TEMP_DIR = '%s'\n" +
        "COMPILER_ENGINE = NODE_JS\n" +
        "JS_ENGINES = [NODE_JS]\n",
        llvm,
        emscripten,
        binaryen,
        os.tmpdir()
    );

    console.log("Emscripten Configuration:\n\n");
    console.log(configuration);

    fs.writeFileSync(path.resolve("./.emscripten"), configuration);
}

build();

const fs = require("fs");
const path = require("path");
const dependencyUtils = require("./dependency-utils");

const BINARYEN_GIT_URL = "https://github.com/WebAssembly/binaryen.git";

function buildBinaryen(directory) {
    console.log("Build Binaryen");

    const binaryenDirectory = path.join(directory, "binaryen");
    const binaryenBuildDirectory = binaryenDirectory;

    dependencyUtils.gitCloneOrPull(BINARYEN_GIT_URL, binaryenDirectory);

    if (!fs.existsSync(binaryenBuildDirectory)) {
        fs.mkdirSync(binaryenBuildDirectory);
    }

    dependencyUtils.exec('cmake -E chdir %s cmake %s', binaryenBuildDirectory, binaryenDirectory);
    dependencyUtils.make(binaryenBuildDirectory);

    return binaryenBuildDirectory;
}

function install(directory) {
    if (process.env.BINARYEN) {
        return process.env.BINARYEN;
    }

    return buildBinaryen(directory);
}

module.exports = { install: install };

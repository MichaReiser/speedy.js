const fs = require("fs");
const path = require("path");
const dependencyUtils = require("./dependency-utils");

const BINARYEN_GIT_URL = "https://github.com/WebAssembly/binaryen.git";

function buildBinaryen(directory) {
    console.log("Build Binaryen");

    const binaryenDirectory = path.join(path.resolve(directory), "binaryen");
    const binaryenBuildDirectory = binaryenDirectory;

    dependencyUtils.gitCloneOrPull(BINARYEN_GIT_URL, binaryenDirectory);

    if (!fs.existsSync(binaryenBuildDirectory)) {
        fs.mkdirSync(binaryenBuildDirectory);
    }

    const absolutePath = path.resolve(binaryenBuildDirectory);

    dependencyUtils.exec('cmake -E chdir "%s" cmake "%s"', binaryenBuildDirectory, binaryenDirectory);
    dependencyUtils.make(binaryenBuildDirectory);

    // The paths needs to be relative as npm install is run in a temporary directory that changes when the installation was successful.
    return path.relative(process.cwd(), binaryenBuildDirectory);
}

function install(directory) {
    const configuredBinaryen = process.env.BINARYEN || process.env.npm_config_BINARYEN;
    if (configuredBinaryen) {
        return configuredBinaryen;
    }

    return buildBinaryen(directory);
}

module.exports = { install: install };

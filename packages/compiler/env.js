/*
 * sets up the environment variables needed
 */
const fs = require("fs");
const path = require("path");

const TOOLS_DIRECTORY = path.resolve("./tools");

let GYP_DEFINES = process.env.GYP_DEFINES;

// Set the environment variable for llvm-node
if (!process.env.GYP_DEFINES) {
    const configurationPath = path.join(TOOLS_DIRECTORY, "configuration.json");
    const configuration = JSON.parse(fs.readFileSync(configurationPath, "utf-8"));

    const LLVM_CONFIG = path.join(configuration.LLVM, "llvm-config");
    GYP_DEFINES="LLVM_CONFIG=" + LLVM_CONFIG;
}

module.exports = {
    GYP_DEFINES: GYP_DEFINES
};


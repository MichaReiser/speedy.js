const util = require("util");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function exec() {
    const fullCommand = util.format.apply(undefined, arguments);
    console.log("Execute '" + fullCommand + "'");
    child_process.execSync(fullCommand, { stdio: "inherit" });
    console.log("\n");
}

function gitCloneOrPull(repository, target) {
    if (fs.existsSync(target) && fs.existsSync(path.join(target, ".git"))) {
        exec("git -C %s pull", target);
    } else {
        exec('git clone --progress %s "%s"', repository, target);
    }
}

function make(directory, install = false) {
    let command = util.format('cmake -E chdir "%s" cmake --build .', directory);
    if (install) {
        command += " --target install";
    }

    exec('%s -- -j%d', command, os.cpus().length - 1);
}

module.exports = {
    exec: exec,
    gitCloneOrPull: gitCloneOrPull,
    make: make,
    COMPILER_TOOLS_DIRECTORY: path.resolve("./tools")
};

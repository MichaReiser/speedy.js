/**
 * Runs lerna bootsrap but ensures that the LLVM_CONFIG Variable points
 * to the llvm installation used
 */

var path = require("path");
var child_process = require("child_process");

var LLVM_CONFIG = process.env.LLVM_CONFIG;

if (!LLVM_CONFIG) {
    var LLVM = process.env.LLVM || path.resolve("./packages/runtime/tools/llvm/build/bin");
    LLVM_CONFIG = path.join(LLVM, "llvm-config");
}

var childEnv = Object.create(process.env);
childEnv.GYP_DEFINITIONS='LLVM_CONFIG="' + LLVM_CONFIG + "'";

child_process.execSync("lerna bootstrap --stream --loglevel verbose", {
    stdio: "inherit",
    env: childEnv
});

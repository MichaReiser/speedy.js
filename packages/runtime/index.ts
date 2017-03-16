import * as path from "path";

const BIN_DIRECTORY = path.join(__dirname, "./bin");

/**
 * Absolute path to where the object and archive files are located that need to be linked against the runtime
 * @type {string}
 */
export const OBJECT_FILES_LOCATION = BIN_DIRECTORY;

/**
 * The path to the Compiler RT File
 * @type {string}
 */
export const COMPILER_RT_FILE = path.join(BIN_DIRECTORY, "./wasm_compiler_rt.a");

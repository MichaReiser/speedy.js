import * as path from "path";

const BIN_DIRECTORY = path.join(__dirname, "./bin");

/**
 * Absolute path to the BC files of the safe runtime
 * @type {string}
 */
export const SAFE_RUNTIME_DIRECTORY = path.join(BIN_DIRECTORY, "safe");

/**
 * Absolute path to the BC files of the unsafe runtime
 * @type {string}
 */
export const UNSAFE_RUNTIME_DIRECTORY = path.join(BIN_DIRECTORY, "unsafe");

/**
 * Path to the shared libraries (libc, malloc...)
 * @type {string}
 */
export const SHARED_LIBRARIES_DIRECTORY = path.join(BIN_DIRECTORY, "shared");

/**
 * The path to the Compiler RT File
 * @type {string}
 */
export const COMPILER_RT_FILE = path.join(BIN_DIRECTORY, "shared", "wasm_compiler_rt.a");

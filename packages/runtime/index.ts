import * as path from "path";

const BIN_DIRECTORY = path.join(__dirname, "./bin");

/**
 * Absolute path to the BC file of the safe runtime
 * @type {string}
 */
export const SAFE_RUNTIME = path.join(BIN_DIRECTORY, "libspeedyjs-runtime.bc");

/**
 * Absolute path to the BC file of the unsafe runtime
 * @type {string}
 */
export const UNSAFE_RUNTIME = path.join(BIN_DIRECTORY, "libspeedyjs-runtime-unsafe.bc");

/**
 * Path to the shared libraries (libc, malloc...)
 * @type {string}
 */
export const SHARED_LIBRARIES_DIRECTORY = path.join(BIN_DIRECTORY, "shared");

/**
 * The path to the Compiler RT File
 * @type {string}
 */
export const COMPILER_RT_FILE = path.join(SHARED_LIBRARIES_DIRECTORY, "wasm_compiler_rt.a");

/**
 * The path to the LIBC RT File
 * @type {string}
 */
export const LIBC_RT_FILE = path.join(SHARED_LIBRARIES_DIRECTORY, "wasm_libc_rt.a");

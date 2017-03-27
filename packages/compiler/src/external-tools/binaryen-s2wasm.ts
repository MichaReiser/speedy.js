import * as debug from "debug";
import {execBinaryen} from "./tools";
import {COMPILER_RT_FILE} from "speedyjs-runtime";

const LOG = debug("external-tools/binaryen-s2wasm");
const EXECUTABLE_NAME = "s2wasm";

/**
 * Creates the .wast file from the given s file
 * @param sFile the s file
 * @param wastFile the name of the wast file
 * @return the path to the .wast file. The caller is responsible for either deleting the working directory or the returned
 * file.
 */
export function s2wasm(sFile: string, wastFile: string, options?: { globalBase?: number, initialMemory?: number}): string {
    LOG(`Compile ${sFile} to wast file`);

    const initialMemory = options && options.initialMemory ? options.initialMemory : 16777216;
    const globalBase = options && options.globalBase ? options.globalBase : 1024;

    execBinaryen(EXECUTABLE_NAME, `"${sFile}" -o "${wastFile}" -l "${COMPILER_RT_FILE}" --emscripten-glue --global-base=${globalBase} --initial-memory=${initialMemory}`);
    return wastFile;
}

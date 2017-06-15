import * as debug from "debug";
import {COMPILER_RT_FILE} from "speedyjs-runtime";
import {execBinaryen} from "./tools";

const LOG = debug("external-tools/binaryen-s2wasm");
const EXECUTABLE_NAME = "s2wasm";

/**
 * Creates the .wast file from the given s file
 * @param sFile the s file
 * @param wastFile the name of the wast file
 * @param options options passed to s2wasm that affect the generated module
 * @return the path to the .wast file. The caller is responsible for either deleting the working directory or the returned
 * file.
 */
export function s2wasm(sFile: string, wastFile: string, { globalBase, initialMemory }: { globalBase: number, initialMemory: number}): string {
    LOG(`Compile ${sFile} to wast file`);

    const args = [sFile, "-o", wastFile, "-l", COMPILER_RT_FILE, "--emscripten-glue", `--global-base=${globalBase}`, `--initial-memory=${initialMemory}`];
    LOG(execBinaryen(EXECUTABLE_NAME, args));
    return wastFile;
}

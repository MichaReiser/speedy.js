import * as debug from "debug";
import {execBinaryen} from "./tools";

const LOG = debug("external-tools/binaryen-opt");
const EXECUTABLE_NAME = "wasm-opt";

/**
 * Optimizes the given wast file
 * @param wastFile the wast file to optimize
 * @param outputFile the name of the resulting wast file the optimization level
 * @return the path to the optimized .wast file. The caller is responsible for either deleting the working directory or the returned
 * file.
 */
export function wasmOpt(wastFile: string, outputFile: string): string {
    LOG(`Optimize ${wastFile}`);

    LOG(execBinaryen(EXECUTABLE_NAME, [wastFile, "-o", outputFile, "--post-emscripten", "--emit-text"]));
    return outputFile;
}

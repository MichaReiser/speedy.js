import * as debug from "debug";
import {execBinaryen} from "./tools";

const LOG = debug("external-tools/binaryen-opt");
const EXECUTABLE_NAME = "wasm-opt";

/**
 * Optimizes the given wast file and creates the resulting wasm file
 * @param wastFile the wast file to optimize
 * @param outputFile the name of the resulting wasm file
 * @param level the optimization level
 * @return the path to the .wasm file. The caller is responsible for either deleting the working directory or the returned
 * file.
 */
export function wasmOpt(wastFile: string, outputFile: string, level: "0" | "1" | "2" | "3" | "z" | "s"): string {
    LOG(`Optimize ${wastFile}`);

    execBinaryen(EXECUTABLE_NAME, `"${wastFile}" -o "${outputFile}" -O${level}`);
    return outputFile;
}

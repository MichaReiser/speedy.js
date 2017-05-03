import * as debug from "debug";
import {execBinaryen} from "./tools";

const LOG = debug("external-tools/binaryen-wasm-as");
const EXECUTABLE_NAME = "wasm-as";

/**
 * Compiles the given wast file to a wasm file
 * @param wast the wast file to compile
 * @param outputFile the file name of the generated wasm file
 */
export function wasmAs(wast: string, outputFile: string) {
    LOG(`Compile wast ${wast} to wasm ${outputFile}`);

    LOG(execBinaryen(EXECUTABLE_NAME, `"${wast}" -o "${outputFile}"`));
}

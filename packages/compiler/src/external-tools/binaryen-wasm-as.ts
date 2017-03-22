import * as debug from "debug";
import {execBinaryen} from "./tools";

const LOG = debug("Binaryen:wasm-as");
const EXECUTABLE_NAME = "wasm-as";

export function wasmAs(wast: string, outputFile: string) {
    LOG(`Compile wast ${wast} to wasm ${outputFile}`);

    execBinaryen(EXECUTABLE_NAME, `"${wast}" -o "${outputFile}"`);
}

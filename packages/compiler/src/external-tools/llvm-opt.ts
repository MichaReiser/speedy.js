import * as debug from "debug";
import {OptimizationLevel} from "../speedyjs-compiler-options";
import {execLLVM} from "./tools";

const LOG = debug("external-tools/llvm-opt");
const EXECUTABLE_NAME = "opt";
// tslint:disable-next-line:max-line-length
const LINK_TIME_OPTIMIZATIONS = ["-strip-debug", "-internalize", "-globaldce", "-disable-loop-vectorization", "-disable-slp-vectorization", "-vectorize-loops=false", "-vectorize-slp=false"]; // Vectorization is not yet supported by the linker backend llc
const DEFAULT_PUBLIC = "speedyJsGc,malloc,__errno_location";

/**
 * Executes the LLVM Optimizer on the given input file
 * @param filename the input file (absolute path)
 * @param optimizedFileName the name of the target file
 * @param level the optimization level
 * @returns the name of the optimized file
 */
export function optimize(filename: string, optimizedFileName: string, level: OptimizationLevel) {
    LOG(`Optimization of file ${filename}`);
    LOG(execLLVM(EXECUTABLE_NAME, [filename, "-o", optimizedFileName, `-O${level}`, "-loop-unswitch", "-loop-unswitch", "-licm", "-irce"]));
    return optimizedFileName;
}

/**
 * Executes the link time optimizations on the given input file
 * @param filename the input file (absolute path)
 * @param publicFunctions name of the public functions
 * @param optimizedFileName the name of the target file
 * @param level the used optimization level. If the level is at least 2, than link time optimizations are performed.
 * @returns the name of the optimized file
 */
export function optimizeLinked(filename: string, publicFunctions: string[], optimizedFileName: string, level: OptimizationLevel) {
    const publicApi = publicFunctions.concat(DEFAULT_PUBLIC).join(",");
    const linkTimeOpts = ["2", "3", "z", "s" ].indexOf(level) !== -1;
    const optimizations = (linkTimeOpts ? ["-std-link-opts"] : []).concat(LINK_TIME_OPTIMIZATIONS);
    const args = [filename, "-o", optimizedFileName, `-internalize-public-api-list=${publicApi}`].concat(optimizations);

    LOG(`Link time optimization of file ${filename}`);
    LOG(execLLVM(EXECUTABLE_NAME, args));
    return optimizedFileName;
}

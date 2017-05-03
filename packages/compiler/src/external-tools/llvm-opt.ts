import * as debug from "debug";
import {execLLVM} from "./tools";
import {OptimizationLevel} from "../speedyjs-compiler-options";

const LOG = debug("external-tools/llvm-opt");
const EXECUTABLE_NAME = "opt";
const LINK_TIME_OPTIMIZATIONS = "-strip-debug -internalize -globaldce -disable-loop-vectorization -disable-slp-vectorization -vectorize-loops=false -vectorize-slp=false -vectorize-slp-aggressive=false";
const DEFAULT_PUBLIC = "speedyJsGc,malloc,__errno_location,memcpy,memmove,memset,__cxa_can_catch,__cxa_is_pointer_type";

/**
 * Executes the LLVM Optimizer on the given input file
 * @param filename the input file (absolute path)
 * @param optimizedFileName the name of the target file
 * @param level the optimization level
 * @returns the name of the optimized file
 */
export function optimize(filename: string, optimizedFileName: string, level: OptimizationLevel) {
    LOG(`Optimization of file ${filename}`);
    LOG(execLLVM(EXECUTABLE_NAME, `"${filename}" -o "${optimizedFileName}" -O${level} -loop-unswitch -loop-unswitch -licm -irce`));
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
    const linktTimeOpts = ["2", "3", "z", "s" ].indexOf(level) !== -1;

    LOG(`Link time optimization of file ${filename}`);
    LOG(execLLVM(EXECUTABLE_NAME, `"${filename}" -o "${optimizedFileName}" ${linktTimeOpts ? "-std-link-opts" : ""} ${LINK_TIME_OPTIMIZATIONS} -internalize-public-api-list="${publicApi}"`));
    return optimizedFileName;
}

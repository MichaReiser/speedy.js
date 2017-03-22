import {CompilerOptions} from "typescript";

export interface SpeedyJSCompilerOptions extends CompilerOptions {
    unsafe?: boolean;
    emitLLVM?: boolean;
    binaryenOpt?: boolean;
}

import {CompilerOptions} from "typescript";

/**
 * Speedy JS Compiler Options
 */
export interface SpeedyJSCompilerOptions extends CompilerOptions {

    /**
     * Indicator if the emitted code and runtime should be memory safe or unsafe (truthy)
     */
    unsafe: boolean | undefined;

    /**
     * Indicator if LLVM IR code should be generated instead of the Web Assembly output
     */
    emitLLVM: boolean;

    /**
     * Indicator if the Binaryen Optimizer should be used on top of the LLVM optimizer
     */
    binaryenOpt: boolean;

    /**
     * Total memory to allocate (Heap + stack) in bytes. As memory grow is not yet supported, this needs to be large enough to
     * run the application
     * @default 16mb 16*1024*1024
     */
    totalMemory: number;

    /**
     * Total memory to be allocated for the stack in bytes. Needs to be less than total Memory.
     * The stack can not be resized during runtime. Therefore, the defined size needs to be large enough to hold of the program.
     * Currently there is no check if a stack overflow happened.
     * @default 5mb (5*1024*1024)
     */
    totalStack: number;

    /**
     * Offset for global variables in bytes
     * @default 1024
     */
    globalBase: number;
}

export type UninitializedSpeedyJSCompilerOptions = {
    [P in keyof SpeedyJSCompilerOptions]?: SpeedyJSCompilerOptions[P] | undefined;
};

export function initializeCompilerOptions(compilerOptions: UninitializedSpeedyJSCompilerOptions): SpeedyJSCompilerOptions {
    const defaults = {
        unsafe: false,
        emitLLVM: false,
        binaryenOpt: false,
        totalMemory: 16 * 1024 * 1024,
        totalStack: 5 * 1024 * 104,
        globalBase: 1024
    };

    for (const key of Object.keys(defaults)) {
        compilerOptions[key] = typeof(compilerOptions[key]) === "undefined" ? (defaults as any)[key] : compilerOptions[key];
    }

    compilerOptions.strictNullChecks = true;
    compilerOptions.noImplicitAny = true; // speedy js cannot handle any
    compilerOptions.noImplicitReturns = true;

    return compilerOptions as SpeedyJSCompilerOptions;
}

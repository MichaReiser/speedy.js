/**
 * This file includes a single statement, the function declaration of the getWasmModuleFactory. This function is used in the
 * speedyjs-transformer to generate the code to load the wasm module.
 * Part of this source code has been taken from https://github.com/kripken/emscripten/blob/incoming/src/runtime.js
 */

enum Allocation {
    /**
     * Tries to use _malloc()
     */
    NORMAL,

    /**
     * Lives for the duration of the current function call
     */
    STACK,

    /**
     * Cannot be freed
     */
    STATIC,

    /**
     * Cannot be freed except through sbrk
     */
    DYNAMIC,

    /**
     * Do not allocate
     */
    NONE
}

interface ModuleLoader {
    (): Promise<WebAssemblyInstance>;
    gc(): void;
}

function __moduleLoader(this: any, bytes: Uint8Array, options: { totalStack: number, totalMemory: number, globalBase: number, staticBump: number }): ModuleLoader {
    const TOTAL_STACK = options.totalStack;
    const TOTAL_MEMORY = options.totalMemory;
    const GLOBAL_BASE = options.globalBase;
    const STATIC_BUMP = options.staticBump;

    const WASM_PAGE_SIZE = 64 * 1024;
    const memory = new WebAssembly.Memory({ initial: TOTAL_MEMORY / WASM_PAGE_SIZE, maximum: TOTAL_MEMORY / WASM_PAGE_SIZE });
    const HEAP32 = new Int32Array(memory.buffer);

    const STATIC_TOP = GLOBAL_BASE + STATIC_BUMP;

    const STACK_BASE = alignMemory(STATIC_TOP);
    const STACK_TOP = STACK_BASE + TOTAL_STACK;
    const STACK_MAX = STACK_BASE + TOTAL_STACK;

    HEAP32[GLOBAL_BASE >> 2] = STACK_TOP;

    // where does the dynamic heap memory start
    const DYNAMIC_BASE = alignMemory(STACK_MAX);
    const DYNAMIC_TOP_PTR = STATIC_TOP;
    HEAP32[DYNAMIC_TOP_PTR>>2] = DYNAMIC_BASE;

    function sbrk(increment: number) {
        increment = increment|0;
        let oldDynamicTop = 0;
        let newDynamicTop = 0;
        let totalMemory = 0;
        increment = ((increment + 15) & -16)|0;
        oldDynamicTop = HEAP32[DYNAMIC_TOP_PTR>>2]|0;
        newDynamicTop = oldDynamicTop + increment | 0;

        if (((increment|0) > 0 && (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
            || (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
            console.error("Cannot grow memory");
            return -1;
        }

        HEAP32[DYNAMIC_TOP_PTR>>2] = newDynamicTop;
        totalMemory = TOTAL_MEMORY|0;
        if ((newDynamicTop|0) > (totalMemory|0)) {
            console.error('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
        }
        return oldDynamicTop|0;
    }

    function alignMemory(size: number, quantum?: number): number {
        return Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16);
    }

    function loadInstance(): Promise<WebAssemblyInstance> {
        let instance: WebAssemblyInstance;

        return WebAssembly.instantiate(bytes.buffer, {
            env: {
                memory: memory,
                STACKTOP: STACK_TOP,
                __dso_handle: 0,
                "__cxa_allocate_exception": function () {
                    console.log("__cxa_allocate_exception", arguments);
                },
                "__cxa_throw": function () {
                    console.log("__cxa_throw", arguments);
                },
                "__cxa_find_matching_catch_2": function () {
                    console.log("__cxa_find_matching_catch_2", arguments);
                },
                "__cxa_free_exception": function () {
                    console.log("__cxa_free_exception", arguments);
                },
                "__resumeException": function () {
                    console.log("__resumeException", arguments);
                },
                "__cxa_atexit": function () {
                    console.log("__cxa_atexit", arguments);
                },
                "pow": function pow(x: number, y: number) {
                    return Math.pow(x, y);
                },
                "fmod": function frem(x: number, y: number) {
                    return x % y;
                },
                "abort": function (what: any) {
                    console.error("Abort WASM for reason: " + what);
                },
                "invoke_ii": function (index: number, a1: number) {
                    return instance.exports.dynCall_ii(index, a1);
                },
                "invoke_iii": function (index: number, a1: number, a2: number) {
                    return instance.exports.dynCall_iii(index, a1, a2);
                },
                "invoke_iiii": function (index: number, a1: number, a2: number, a3: number) {
                    return instance.exports.dynCall_iiii(index, a1, a2, a3);
                },
                "invoke_iiiii": function (index: number, a1: number, a2: number, a3: number, a4: number) {
                    return instance.exports.dynCall_iiiii(index, a1, a2, a3, a4);
                },
                "invoke_viii": function (index: void, a1: number, a2: number, a3: number) {
                    return instance.exports.dynCall_viii(index, a1, a2, a3);
                },
                "sbrk": sbrk
            }
        }).then(result => instance = result.instance);
    }

    let speedyJsGc: () => void | undefined;
    function gc() {
        if (speedyJsGc) {
            speedyJsGc();
        }
    }

    let loaded: Promise<WebAssemblyInstance> | undefined = undefined;
    const loader = function loader () {
        if (loaded) {
            return loaded;
        }

        loaded = loadInstance().then(instance => {
            speedyJsGc = instance.exports.speedyJsGc;
            return instance;
        });
        return loaded;
    } as ModuleLoader;

    loader.gc = gc;

    return loader;
}

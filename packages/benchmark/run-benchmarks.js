"use strict";

const TEST_CASES = {
    "fib": {
        fnName: "fib",
        args: [40],
        result: 102334155
    },
    "prime": {
        fnName: "isPrime",
        args: [2147483647],
        result: true
    },
    "nsieve": {
        args: [40000],
        result: 4203
    }
};

function createMemory() {
    var TOTAL_STACK = /* Module['TOTAL_STACK'] || */ 5242880;
    var TOTAL_MEMORY = /* Module['TOTAL_MEMORY'] || */ 16777216;

    var WASM_PAGE_SIZE = 64 * 1024;

    var totalMemory = WASM_PAGE_SIZE;
    while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
        if (totalMemory < 16*1024*1024) {
            totalMemory *= 2;
        } else {
            totalMemory += 16*1024*1024;
        }
    }
    if (totalMemory !== TOTAL_MEMORY) {
        TOTAL_MEMORY = totalMemory;
    }

    const memory = new WebAssembly.Memory({ initial: TOTAL_MEMORY / WASM_PAGE_SIZE, maximum: TOTAL_MEMORY / WASM_PAGE_SIZE });
    const HEAP32 = new Int32Array(memory.buffer);

    var STATIC_BASE, STATICTOP, staticSealed; // static area
    var STACK_BASE, STACKTOP, STACK_MAX; // stack area
    var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

    STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
    STATIC_BASE = 1024;

    STATICTOP = STATIC_BASE + 5600 + 4  * 16;
    STACKTOP = STACK_BASE = alignMemory(STATIC_BASE);

    STACKTOP = STACK_BASE + TOTAL_STACK;
    HEAP32[1024 >> 2] = STACKTOP; // Adresse 1024 wird mit Stacktop initialisiert. Stacktop (global) wird bei s2wasm mitgegeben
    // Current crash is because allocation reaches --global (static area)

    STACK_MAX = STACK_BASE + TOTAL_STACK;

    DYNAMIC_BASE = alignMemory(STACK_MAX);

    HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

    function _sbrk(increment) {
        // console.log("sbrk");
        increment = increment|0;
        var oldDynamicTop = 0;
        var oldDynamicTopOnChange = 0;
        var newDynamicTop = 0;
        var totalMemory = 0;
        increment = ((increment + 15) & -16)|0;
        oldDynamicTop = HEAP32[DYNAMICTOP_PTR>>2]|0;
        newDynamicTop = oldDynamicTop + increment | 0;

        if (((increment|0) > 0 & (newDynamicTop|0) < (oldDynamicTop|0)) // Detect and fail if we would wrap around signed 32-bit int.
            | (newDynamicTop|0) < 0) { // Also underflow, sbrk() should be able to be used to subtract.
            console.error("Cannot grow memory");
            return -1;
        }

        HEAP32[DYNAMICTOP_PTR>>2] = newDynamicTop;
        totalMemory = TOTAL_MEMORY|0;
        if ((newDynamicTop|0) > (totalMemory|0)) {
            console.error('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
        }
        return oldDynamicTop|0;
    }

    function alignMemory(size, quantum) {
        return size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16);
    }

    return { memory: memory, _sbrk: _sbrk, STACKTOP: STACKTOP };
}

/**
 * TODO: Move to Typescript Transformer
 * @param name
 * @return {any}
 */
async function loadWasmModule(name) {
    const mem = createMemory();
    const bytes = new Uint8Array(require("./cases/" + name + ".wasm"));

    const { instance } = await WebAssembly.instantiate(bytes.buffer, {
        env: {
            memory: mem.memory,
            imports: {
                "fmod": function frem(x, y) {
                    return x % y;
                }
            },
            STACKTOP: mem.STACKTOP,
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
            "abort": function (what) {
                console.error("Abort WASM for reason: " + what);
            },
            "invoke_ii": function (index, a1) {
                // console.log("invoke_iii", arguments);
                return instance.exports.dynCall_ii(index, a1);
            },
            "invoke_iii": function (index, a1, a2) {
                // console.log("invoke_iii", arguments);
                return instance.exports.dynCall_iii(index, a1, a2);
            },
            "invoke_viii": function (index, a1, a2, a3) {
                // console.log("invoke_viii", arguments);
                return instance.exports.dynCall_viii(index, a1, a2, a3);
            },
            "sbrk": mem._sbrk
        }
    });

    return instance;
}

function getJsFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = TEST_CASES[caseName].fnName || caseName;
    const fn = require("./cases/" + caseName + ".ts")[fnName];

    const wrapped = function () {
        return fn.apply(undefined, testCase.args);
    };

    const jsResult = wrapped();
    if (jsResult != testCase.result) {
        console.error(`JS Result for Test Case ${caseName} returned ${jsResult} instead of ${testCase.result}`);
    }

    return wrapped;
}

async function getWasmFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const instance = await loadWasmModule(caseName);
    const fnName = testCase.fnName || caseName;
    const fn = instance.exports[fnName];

    const wrapped = function () {
        return fn.apply(undefined, testCase.args);
    };

    const wasmResult = wrapped();
    if (wasmResult != testCase.result) {
        console.error(`WASM Result for Test Case ${caseName} returned ${wasmResult} instead of ${testCase.result}`);
    }

    return wrapped;
}

function runBenchmarks() {
    for (const testCase of Object.keys(TEST_CASES)) {
        suite(testCase, function () {
            let wasmFn = undefined;
            const jsFn = getJsFunctionForTestCase(testCase);

            benchmark("js", function (deferred) {
                jsFn();
                deferred.resolve();
            }, { defer: true });

            benchmark("wasm", function (deferred) {
                wasmFn();
                deferred.resolve();
            },
            {
                defer: true,
                setup: function (deferred) {
                    getWasmFunctionForTestCase(testCase)
                        .then(function (loadedWasmFn) {
                            wasmFn = loadedWasmFn;
                            deferred.suResolve();
                        });
                }
            });
        });
    }
}

module.exports = runBenchmarks;



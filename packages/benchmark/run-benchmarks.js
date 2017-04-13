"use strict";

const TEST_CASES = {
    "tspLarge": {
        args: [],
        result: 14212.721606057083
    },
    "mergeSort": {
        args: [],
        result: 1659.0906736166776
    },
    "mergeSortInt": {
        args: [],
        result: 7.643593152571829e+21
    },
    "simjs": {
        args: [10],
        result: 0.7216851827628226
    },
    "tsp": {
        args: [],
        result: 135751.77804825202
    },
    "tspArray": {
        args: [],
        result: 135751.77804825202
    },
    "tspArrayLarge": {
        args: [],
        result: 14212.721606057083
    },
    "arrayElementAccess": {
        args: [],
        result: 487.65628197917226
    },
    "pow": {
        args: [],
        result: 333325
    },
    "powInt": {
        args: [],
        result: 328350
    },
    "sqrt": {
        args: [1000.0],
        result: 21081.91129744694
    },
    "sqrtInt": {
        args: [1000],
        result: 21065.833110879048
    },
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

async function getJsFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = TEST_CASES[caseName].fnName || caseName;
    const fn = require("ts-loader!./cases/" + caseName + ".ts")[fnName];

    const wrapped = function () {
        return fn.apply(undefined, testCase.args);
    };

    const jsResult = await wrapped();
    if (jsResult !== testCase.result) {
        console.error(`JS Result for Test Case ${caseName} returned ${jsResult} instead of ${testCase.result}`);
    }

    return wrapped;
}

async function getWasmFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const wasmModule = require("speedyjs-loader?{speedyJS:{unsafe: true, totalMemory: 134217728, exportGc: true, disableHeapNukeOnExit: true, optimizationLevel: 2}}!./cases/tspLarge.ts");
    const fn = wasmModule[fnName];
    const gc = wasmModule["speedyJsGc"];

    const wrapped = function () {
        return fn.apply(undefined, testCase.args);
    };

    const wasmResult = await wrapped();
    gc();

    if (wasmResult !== testCase.result) {
        console.error(`WASM Result for Test Case ${caseName} returned ${wasmResult} instead of ${testCase.result}`);
    }

    return { fn: wrapped, gc: gc };
}

function runBenchmarks() {
    for (const testCase of Object.keys(TEST_CASES)) {
        suite(testCase, function () {
            let wasmFn = undefined;
            let speedyJsGc = undefined;
            let jsFn = undefined;

            benchmark("js", function (deferred) {
                jsFn().then(function () {
                    deferred.resolve();
                });
            }, {
                defer: true,
                setup: function (deferred) {
                    getJsFunctionForTestCase(testCase).then(function (fn) {
                        jsFn = fn;
                        deferred.suResolve();
                    });
                }
            });

            benchmark("wasm", function (deferred) {
                wasmFn().then(function () {
                    deferred.resolve();
                });
            },
            {
                defer: true,
                setup: function (deferred) {
                    getWasmFunctionForTestCase(testCase)
                        .then(function (result) {
                            wasmFn = result.fn;
                            speedyJsGc = result.gc;
                            deferred.suResolve();
                        });
                },
                onCycle: function () { // Is not called after each loop, but after some execution, so might need a little bit more memory
                    speedyJsGc();
                }
            });
        });
    }
}

module.exports = runBenchmarks;



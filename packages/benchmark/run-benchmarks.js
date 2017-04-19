"use strict";

const TEST_CASES = {
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
    "tspLarge": {
        args: [],
        result: 14212.721606057083
    },
    "tspArray": {
        args: [],
        result: 135751.77804825202
    },
    "tspArrayLarge": {
        args: [],
        result: 14212.721606057083
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

    const wrapped = function jsFunctionWrapper() {
        return fn.apply(undefined, testCase.args);
    };

    // invoke function once to be fair ;)
    await wrapped();

    return wrapped;
}

async function getWasmFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const wasmModule = require("speedyjs-loader?{speedyJS:{unsafe: true, totalMemory: 134217728, exportGc: true, disableHeapNukeOnExit: true, optimizationLevel: 3, binaryenOpt: true}}!./cases/" + caseName + ".ts");
    const fn = wasmModule[fnName];
    const gc = wasmModule["speedyJsGc"];

    const wrapped = function wasmFunctionWrapper() {
        return fn.apply(undefined, testCase.args);
    };

    // Invoke function once to force module instantiation
    await wrapped();
    gc();

    return { fn: wrapped, gc: gc };
}

let runBenchmark = function (caseName, testCase, run) {
    let wasmFn = undefined;
    let speedyJsGc = undefined;
    let jsFn = undefined;

    benchmark(run ? `js-${run}` : "js", function (deferred) {
        jsFn().then(function (result) {
            if (result !== testCase.result) {
                throw new Error(`JS Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
            }

            deferred.resolve();
        });
    }, {
        defer: true,
        setup: function (deferred) {
            getJsFunctionForTestCase(caseName).then(function (fn) {
                jsFn = fn;
                deferred.suResolve();
            });
        }
    });

    benchmark(run ? `wasm-${run}` : "wasm", function (deferred) {
            wasmFn().then(function (result) {
                if (result !== testCase.result) {
                    throw new Error(`WASM Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
                }

                deferred.resolve();
            });
        },
        {
            defer: true,
            setup: function (deferred) {
                getWasmFunctionForTestCase(caseName)
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
};
function runBenchmarks(numRuns = 1) {
    for (const caseName of Object.keys(TEST_CASES)) {
        const testCase = TEST_CASES[caseName];

        suite(caseName, function () {
            if (numRuns === 1) {
                runBenchmark(caseName, testCase);
            } else {
                for (let i = 0; i < numRuns; ++i) {
                    runBenchmark(caseName, testCase, i);
                }
            }
        });
    }
}

module.exports = runBenchmarks;



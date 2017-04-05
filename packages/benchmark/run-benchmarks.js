"use strict";

const TEST_CASES = {
    "pow": {
        args: [19800.3, 2],
        result: 392051880.09
    },
    "powInt": {
        args: [3500, 2],
        result: 12250000
    },
    "sqrt": {
        args: [392051880.09],
        result: 19800.3
    },
    "sqrtInt": {
        args: [12250000],
        result: 3500
    },
    "tspArray": {
        args: [],
        result: 137801.8213098867
    },
    "tspArrayLarge": {
        args: [],
        result: 334425.4299374184
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

    const options = { speedyJS: { unsafe: false } };
    if (testCase.totalMemory) {
        options.speedyJS.totalMemory = testCase.totalMemory;
    }

    const wasmModule = require("speedyjs-loader?{speedyJS:{unsafe: true, totalMemory: 134217728, exportGc: true, disableNukeHeapOnExit: true}}!./cases/" + caseName + ".ts");
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



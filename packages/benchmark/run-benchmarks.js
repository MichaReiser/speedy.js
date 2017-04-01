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
    const fn = require("speedyjs-loader!./cases/" + caseName + ".ts")[fnName];

    const wrapped = function () {
        return fn.apply(undefined, testCase.args);
    };

    const wasmResult = await wrapped();
    if (wasmResult !== testCase.result) {
        console.error(`WASM Result for Test Case ${caseName} returned ${wasmResult} instead of ${testCase.result}`);
    }

    return wrapped;
}

function runBenchmarks() {
    for (const testCase of Object.keys(TEST_CASES)) {
        suite(testCase, function () {
            let wasmFn = undefined;
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



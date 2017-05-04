"use strict";

const benchmarkImport = require("benchmark");
const _ = require("lodash");
const platform = require("platform");

const Benchmark = window.Benchmark = benchmarkImport.runInContext( { _: _, platform: platform });

const TEST_CASES = {
    "tspInt": {
        args: [],
        result: 500074.11491760757
    },
    "simjs": {
        args: [10, 1000],
        result: 969.1866817441974
    },
    "tspArrayInt": {
        args: [],
        result: 500074.11491760757
    },
    "tspArrayDouble": {
        args: [],
        result: 500016.6164722443
    },
    "tspDouble": {
        args: [],
        result: 500016.6164722443
    },
    "mergeSort": {
        args: [],
        result: 1659.0906736166776
    },
    "mergeSortInt": {
        args: [],
        result: 7.643593152571829e+21
    },
    "fib": {
        fnName: "fib",
        args: [40],
        result: 102334155
    },
    "isPrime": {
        args: [2147483647],
        result: true
    },
    "nsieve": {
        args: [40000],
        result: 4203
    },
    // "createPoints": {
    //     args: [10],
    //     result: 114038
    // },
    "doubleAdd": {
        args: [],
        result: 1.0000099999980838
    },
    "doubleCompare": {
        args: [],
        result: 4999951.000000405
    },
    "intCompare": {
        args: [2548965],
        result: 2548965
    },
    "arrayReverse": {
        args: [],
        result: 1222.1247886583424
    }
};

function getJsFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = TEST_CASES[caseName].fnName || caseName;
    const fn = require("ts-loader!./cases/" + caseName + ".ts")[fnName];

    function jsFunctionWrapper() {
        return Promise.resolve(fn.apply(undefined, testCase.args));
    }

    return jsFunctionWrapper;
}

function getWasmFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const wasmModule = require("!speedyjs-loader?{speedyJS:{unsafe: true, exportGc: true, disableHeapNukeOnExit: true, optimizationLevel: 3, binaryenOpt: true}}!./cases/" + caseName + "-spdy.ts");
    const fn = wasmModule[fnName];
    const gc = wasmModule["speedyJsGc"];

    function wasmFunctionWrapper() {
        return fn.apply(undefined, testCase.args);
    }

    return { fn: wasmFunctionWrapper, gc: gc };
}

async function getEmccFunctionForTestCase(caseName) {
    const testCase = TEST_CASES[caseName];
    const fnName = testCase.fnName || caseName;

    const emccModule = require("exports-loader?Module!./cases/" + caseName + "-emcc.js");
    await emccModule.initialized;

    const fn = emccModule["_" + fnName];

    function emccFunctionWrapper() {
        let result = fn.apply(undefined, testCase.args);
        if (typeof(testCase.result) === "boolean") {
            result = result !== 0;
        }

        return Promise.resolve(result);
    }

    return emccFunctionWrapper;
}

async function addBenchmark(suite, testCase, run) {
    const caseName = suite.name;

    const jsFn = getJsFunctionForTestCase(caseName);
    const { fn: wasmFn, gc: speedyJsGc } = getWasmFunctionForTestCase(caseName);
    const emccFn = await getEmccFunctionForTestCase(caseName);

    // call each function once to not profile loading time
    jsFn();
    await wasmFn();
    await emccFn();

    suite.add(run ? `js-${run}` : "js", function (deferred) {
        jsFn().then(function (result) {
            if (result !== testCase.result) {
                throw new Error(`JS Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
            }

            deferred.resolve();
        });
    }, {
        defer: true
    });

    suite.add(run ? `emcc-${run}` : "emcc", function (deferred) {
        emccFn().then(function (result) {
            if (result !== testCase.result) {
                throw new Error(`EMCC Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
            }

            deferred.resolve();
        });
    }, {
        defer: true
    });

    suite.add(run ? `wasm-${run}` : "wasm", function (deferred) {
            wasmFn().then(function (result) {
                if (result !== testCase.result) {
                    throw new Error(`WASM Result for Test Case ${caseName} returned ${result} instead of ${testCase.result}`);
                }

                deferred.resolve();
            });
        },
        {
            defer: true,
            onCycle: function () { // Is not called after each loop, but after some execution, so might need a little bit more memory
                speedyJsGc();
            }
        }
    );

    return suite;
}

async function createSuite(caseName, numRuns = 1) {
    const suite = new Benchmark.Suite(caseName, { async: true });
    if (numRuns === 1) {
        await addBenchmark(suite, TEST_CASES[caseName]);
    } else {
        for (let i = 0; i < numRuns; ++i) {
            await addBenchmark(suite, TEST_CASES[caseName], i);
        }
    }

    return suite;
}

function runSuites(numRuns = 1, beforeRun, progress) {
    const pendingNames = Object.keys(TEST_CASES).reverse();
    const totalCases = pendingNames.length;

    function processNext() {
        if (pendingNames.length === 0) {
            return;
        }

        progress(totalCases - pendingNames.length, totalCases);

        const next = pendingNames.pop();
        return createSuite(next, numRuns)
            .then(suite => {
                return new Promise((resolve, reject) => {
                    beforeRun(suite);

                    suite.on("complete", resolve);
                    suite.on("error", reject);

                    suite.run({ async: true });
                });
            })
            .then(processNext);
    }

    return Promise.resolve(1).then(processNext);
}

module.exports = runSuites;



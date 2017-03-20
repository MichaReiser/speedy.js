const benchmarkImport = require("benchmark");
const _ = require("lodash");
const platform = require("platform");

const Benchmark = window.Benchmark = benchmarkImport.runInContext( { _: _, platform: platform });

const runBenchmarks = require("./run-benchmarks");

const output = document.querySelector("#output");
const json = document.querySelector("#json");

let suites = [];
let result = {};

function addSuite(name, fn, options) {
    const suite = new Benchmark.Suite(name, options);
    try {
        global.benchmark = addBenchmark.bind(undefined, suite);
        fn();
    } finally {
        delete global.benchmark;
    }
    suites.push(suite);
}

function addBenchmark(suite, name, fn, options) {
    suite.add(name, fn, options);
}

function runNextSuite() {
    const suite = suites.shift();

    if (suite) {
        suite.on("start", function () {
            output.innerHTML += suite.name + "...<br/>";
        });

        suite.on("cycle", function (event) {
            const benchmark = event.target;
            const suiteResults = result[suite.name] = result[suite.name] || {};
            suiteResults[benchmark.name] = {
                info: benchmark.toString(),
                name: benchmark.name,
                hz: benchmark.hz,
                count: benchmark.count,
                cycles: benchmark.cycles,
                stats: benchmark.stats,
                times: benchmark.times,
                error: benchmark.error
            };

            output.innerHTML += "&nbsp;&nbsp;" + benchmark.toString() + "<br/>";
        });

        suite.on("complete", function () {
            output.innerHTML +=  "<br/>";

            const fastest = suite.filter("fastest")[0];
            result[suite.name][fastest.name].fastest = true;

            runNextSuite();
        });

        suite.run({ async: true });
    } else {
        complete();
    }
}

function complete() {
    printSummary();

    output.innerHTML += "Done!";

    json.textContent = JSON.stringify(result, undefined, "  ");
    runButton.disabled = undefined;
}

function printSummary() {
    for (const suite of Object.keys(result)) {
        const benchmarks = result[suite];
        const fastest = Object.values(benchmarks).find(benchmark => benchmark.fastest);
        const others = Object.values(benchmarks).filter(benchmark => benchmark !== fastest);

        if (others.length) {
            const comparison = others.map(other => `${(fastest.hz / other.hz).toFixed(2)}x faster than ${other.name}`).join(", ");
            output.innerHTML += `${suite}: ${fastest.name} at ${fastest.hz.toFixed(2)} ops/sec (${comparison})</br>`;
        }
    }
}

// expected from karma-benchmark
global.suite = addSuite;
const runButton = document.querySelector("#run");

runButton.addEventListener("click", function () {
    runButton.disabled = "disabled";
    output.textContent = json.textContent = "";
    result = {};

    runBenchmarks();
    setImmediate(runNextSuite);
});





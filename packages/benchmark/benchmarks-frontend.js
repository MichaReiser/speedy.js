const runSuites = require("./run-benchmarks");
const barChart = require("./chart.ts");

const output = document.querySelector("#output");
const json = document.querySelector("#json");
const chart = barChart("#chart");

let suites = [];
let result;

function complete() {
    printSummary();

    progress.style.width = "100%";
    output.innerHTML += "Done!";

    json.textContent = JSON.stringify(result, undefined, "  ");
    chart.render(benchmarkToChartResults(result));
    buttons.forEach(button => button.disabled = undefined);
}

function printSummary() {
    for (const suite of Object.keys(result.suites)) {
        const benchmarks = result.suites[suite];
        const fastest = Object.values(benchmarks).find(benchmark => benchmark.fastest);
        const others = Object.values(benchmarks).filter(benchmark => benchmark !== fastest);

        if (others.length) {
            const comparison = others.map(other => `${(fastest.hz / other.hz).toFixed(2)}x faster than ${other.name}`).join(", ");
            output.innerHTML += `${suite}: ${fastest.name} at ${fastest.hz.toFixed(2)} ops/sec (${comparison})</br>`;
        }
    }
}

const runButton = document.querySelector("#run");
const run5TimesButton = document.querySelector("#run-5x");
const buttons = [runButton,  run5TimesButton];
const progress = document.querySelector("#progress-bar");

function progressHandler(current, total) {
    progress.style.width = current / total * 100 + "%";
}

function beforeSuiteRun(suite) {
    suite.on("start", function () {
        output.innerHTML += suite.name + "...<br/>";
    });

    suite.on("cycle", function (event) {
        const benchmark = event.target;
        const suiteResults = result.suites[suite.name] = result.suites[suite.name] || {};
        suiteResults[benchmark.name] = {
            suite: suite.name,
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
        result.suites[suite.name][fastest.name].fastest = true;
    });
}

function startBenchmark (numRuns=1) {
    buttons.forEach(button => button.disabled = "disabled");
    output.textContent = json.textContent = "";
    result = { platform: platform, suites: {} };
    progress.style.width = "0%";
    progress.parentNode.attributes.removeNamedItem("hidden");

    runSuites(numRuns, beforeSuiteRun, progressHandler).then(complete);
}

runButton.addEventListener("click", function () {
    startBenchmark();
});

run5TimesButton.addEventListener("click", function () {
    startBenchmark(5);
});

function benchmarkToChartResults(result) {
    const browserId = result.platform.description;
    const browsers = [ { id: browserId, name: result.platform.name + " " + result.platform.version }];

    const testCases = _.chain(Object.keys(result.suites))
        .map(caseName => {
            const testCase = result.suites[caseName];
            return {
                name: caseName,
                results: {
                    [browserId]: {
                        js: testCase.js.hz,
                        wasm: testCase.wasm.hz,
                        emcc: testCase.emcc.hz
                    }
                }
            };
        })
        .value();
    return { browsers: browsers, testCases: testCases };
}



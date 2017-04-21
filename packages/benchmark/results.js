const _  = require("lodash");
const barChart = require("./chart");

const chart = barChart("#chart");

function reload() {
    const results = require("./results.json");
    chart(benchmarkToChartResults(results));
}

reload();

function benchmarkToChartResults(benchmarkResult) {
    const browsers = Object.keys(benchmarkResult.browsers).map(browserId => { return { name: benchmarkResult.browsers[browserId].name, id: browserId } });
    const testCases = _.chain(Object.keys(benchmarkResult.browsers))
        .flatMap(browserId => benchmarkResult.result[browserId].map(result => { return { browser: browserId, benchmark: result.benchmark } }))
        .groupBy(testCase => testCase.benchmark.suite)
        .map(testResults => {
            const resultsPerBrowser = _.chain(testResults)
                .groupBy(testCase => testCase.browser)
                .mapValues(browserResult => {
                    let wasm, js;
                    if (browserResult[0].benchmark.name === "js") {
                        js = browserResult[0];
                        wasm = browserResult[1];
                    } else {
                        js = browserResult[1];
                        wasm = browserResult[0];
                    }

                    return { js: js.benchmark.hz, wasm: wasm.benchmark.hz };
                }).value();


            return { name: testResults[0].benchmark.suite, results: resultsPerBrowser };
        })
        .value();

    return { browsers: browsers, testCases: testCases };
}



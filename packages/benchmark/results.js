const _  = require("lodash");
const barChart = require("./chart");

const chart = barChart("#chart");
const resultsContext = require.context("./results", false, /.*\.json/);

function populateWithFileNames(selection) {
    const fileNames = resultsContext.keys().sort();
    for (let i = 0; i < fileNames.length; ++i) {
        const file = fileNames[i];
        const option = document.createElement("option");

        option.value = file;
        option.selected = i === 0;
        option.innerText = file;
        selection.appendChild(option);
    }
}

function renderChartWithDataFromFile(file) {
    const fileContent = resultsContext(file);
    const chartData = transformResultToChartData(fileContent);

    chart.render(chartData);
}

function onSelectedFileChanged(event) {
    renderChartWithDataFromFile(event.target.value);
}

function propertyByStringComparator(mapper) {
    return function (x, y) {
        return stringComparator(mapper(x), mapper(y));
    }
}

function stringComparator(x, y) {
    if (x === y) {
        return 0;
    }

    return x < y ? -1 : 1;
}

function transformResultToChartData(browserResults) {
    const browsers = browserResults.map(result => { return { name: result.platform.name, version: result.platform.version, id: result.platform.description } });
    // all test cases
    const testCases = _.chain(browserResults).flatMap(result => Object.keys(result.suites)).uniq().map(testSuite => { return { name: testSuite, results: {} }; }).value();

    for (let i = 0; i < browserResults.length; ++i) {
        const browserId = browserResults[i].platform.description;
        const suites = browserResults[i].suites;

        for (const testCase of testCases) {
            const browserResults = suites[testCase.name] || {};
            const jsResultNames = Object.keys(browserResults).filter(name => name.indexOf("js") !== -1);
            const wasmResultNames = Object.keys(browserResults).filter(name => name.indexOf("wasm") !== -1);
            const emccResultNames = Object.keys(browserResults).filter(name => name.indexOf("emcc") !== -1);

            const jsAvg = jsResultNames.reduce((memo, current) => memo + browserResults[current].hz, 0) / jsResultNames.length;
            const wasmAvg = wasmResultNames.reduce((memo, current) => memo + browserResults[current].hz, 0) / wasmResultNames.length;
            const emccAvg = emccResultNames.reduce((memo, current) => memo + browserResults[current].hz, 0) / emccResultNames.length;

            testCase.results[browserId] = { js: jsAvg, wasm: wasmAvg, emcc: emccAvg };
        }
    }

    return {
        browsers: browsers.sort(propertyByStringComparator(browser => browser.id)),
        testCases: testCases.sort(propertyByStringComparator(testCase => testCase.name))
    };
}

const fileSelection = document.querySelector("#file");

fileSelection.addEventListener("change", onSelectedFileChanged);
populateWithFileNames(fileSelection, resultsContext);

if (resultsContext.keys().length > 0) {
    renderChartWithDataFromFile(resultsContext.keys()[0]);
}

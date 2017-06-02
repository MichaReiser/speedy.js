const _  = require("lodash");
const barChart = require("./chart");

const chart = barChart("#chart");
const resultsContext = require.context("./results", false, /.*\.json/);

function removeChildNodes(node) {
    let last;
    while (last = node.lastChild) {
        node.removeChild(last);
    }
}

function isVisible(x) {
    return x.visible !== false;
}

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

function populateBrowserNames(data) {
    const browsers = document.querySelector("#browsers");
    removeChildNodes(browsers);

    for (const browser of data.browsers) {
        const label = document.createElement("label");
        label.className = "form-check-label";

        const check = document.createElement("input");
        check.setAttribute("type", "checkbox");
        check.setAttribute("id", browser.id);
        check.setAttribute("value", browser.id);
        check.setAttribute("name", "browser");
        check.setAttribute("checked", "checked");
        check.className = "form-check-input";

        label.appendChild(check);
        label.appendChild(document.createTextNode(browser.name + " " + browser.version));

        const div = document.createElement("div");
        div.className = "form-check";
        div.appendChild(label);

        check.addEventListener("change", function (event) {
            changeBrowserSelection(event, data);
        });

        browsers.appendChild(div);
    }
}

function populateTestCases(data) {
    const testCases = document.querySelector("#testCases");
    removeChildNodes(testCases);

    for (const testCase of data.testCases) {
        const label = document.createElement("label");
        label.className = "form-check-label";

        const check = document.createElement("input");
        check.setAttribute("type", "checkbox");
        check.setAttribute("id", testCase.name);
        check.setAttribute("value", testCase.name);
        check.setAttribute("name", "testCase");
        check.setAttribute("checked", "checked");
        check.className = "form-check-input";

        label.appendChild(check);
        label.appendChild(document.createTextNode(testCase.name));

        const div = document.createElement("div");
        div.className = "form-check";
        div.appendChild(label);

        check.addEventListener("change", function (event) {
            changeTestCaseSelection(event, data);
        });

        testCases.appendChild(div);
    }
}

function changeTestCaseSelection(event, data) {
    const testCase = data.testCases.find(function (data) {
        return data.name === event.target.value;
    });

    testCase.visible = event.target.checked;

    renderChart(data);
}

function changeBrowserSelection(event, data) {
    const browser = data.browsers.find(function (data) {
        return data.id === event.target.value;
    });

    browser.visible = event.target.checked;

    renderChart(data);
}

function renderChart(data) {
    document.querySelector("#json").innerText = JSON.stringify(toMathematicaData(data), undefined, "  ");
    renderTable(data);
    chart.render(data);
}

function renderChartWithDataFromFile(file) {
    const fileContent = resultsContext(file);
    const chartData = transformResultToChartData(fileContent);

    populateBrowserNames(chartData);
    populateTestCases(chartData);

    renderChart(chartData);
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

function toMathematicaData(chartData) {
    const visibleBrowsers = chartData.browsers.filter(isVisible);
    const visibleCases = chartData.testCases.filter(isVisible);

    const result = {
        caseNames: visibleCases.map(testCase => testCase.name),
        percentages: {},
        ops: {}
    };

    for (const browser of visibleBrowsers) {
        const ops = result.ops[browser.name] = [];
        const percentages = result.percentages[browser.name] = [];
        for (const testCase of visibleCases) {
            ops.push(testCase.results[browser.id].wasm);
            percentages.push(testCase.results[browser.id].wasm / testCase.results[browser.id].js * 100);
        }
    }

    return result;
}

function appendCell(row, text, tag="td") {
    const cell = document.createElement(tag);
    cell.innerText = text;
    row.appendChild(cell);
    return cell;
}

function appendNumberCell(row, text) {
    const cell = appendCell(row, text);
    cell.setAttribute("style", "text-align: right");
    return cell;
}


function percentageDifference(a, b) {
    return Math.abs(a - b) / ((a + b) / 2);
}

function renderTable(chartData) {
    const visibleBrowsers= chartData.browsers.filter(isVisible);
    const visibleTestCases = chartData.testCases.filter(isVisible);

    const table = document.querySelector("#results-table");
    removeChildNodes(table);

    const headerRow = document.createElement("tr");
    const subtitleRow = document.createElement("tr");
    const subSubTitleRow = document.createElement("tr");
    const titles = ["Test Case", "JavaScript", "Speedy.js"];

    for (const title of titles) {
        const titleCell = appendCell(headerRow, title, "th");

        if (title !== titles[0]) {
            titleCell.colSpan = visibleBrowsers.length * 2 + 1;

            for (const subTitle of visibleBrowsers.map(browser => browser.name + " " + browser.version)) {
                const cell = appendCell(subtitleRow, subTitle, "th");
                cell.colSpan = 2;

                appendCell(subSubTitleRow, "ops/s", "th");
                appendCell(subSubTitleRow, "±E %", "th");
            }
            appendCell(subtitleRow, "d", "th");
            appendCell(subSubTitleRow, " ", "th");
        } else {
            appendCell(subtitleRow, " ", "th");
            appendCell(subSubTitleRow, " ", "th");
        }
    }

    const header = document.createElement("thead");
    header.appendChild(headerRow);
    header.appendChild(subtitleRow);
    header.appendChild(subSubTitleRow);
    table.appendChild(header);

    const body = document.createElement("tbody");

    for (const testCase of visibleTestCases) {
        const row = document.createElement("tr");
        let minJS = Number.MAX_SAFE_INTEGER,
            maxJS = Number.MIN_SAFE_INTEGER;

        appendCell(row, testCase.name);

        for (const browser of visibleBrowsers) {
            const js = testCase.results[browser.id].js;
            minJS = Math.min(minJS, js);
            maxJS = Math.max(maxJS, js);

            appendNumberCell(row, js.toFixed(1));
            appendNumberCell(row, testCase.results[browser.id].jsRme.toFixed(1))
        }

        appendNumberCell(row, (100 * percentageDifference(minJS, maxJS)).toFixed(1));

        let minSpeedy = Number.MAX_SAFE_INTEGER,
            maxSpeedy = Number.MIN_SAFE_INTEGER;

        for (const browser of visibleBrowsers) {
            const speedyJs =  testCase.results[browser.id].wasm;
            minSpeedy = Math.min(minSpeedy, speedyJs);
            maxSpeedy = Math.max(maxSpeedy, speedyJs);
            appendNumberCell(row, speedyJs.toFixed(1));
            appendNumberCell(row, testCase.results[browser.id].wasmRme.toFixed(1));
        }

        appendNumberCell(row, (100 * percentageDifference(minSpeedy, maxSpeedy)).toFixed(1));

        body.appendChild(row);
    }

    table.appendChild(body);
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
            const jsRme = jsResultNames.reduce((memo, current) => memo + browserResults[current].stats.rme, 0) / jsResultNames.length;
            const wasmAvg = wasmResultNames.reduce((memo, current) => memo + browserResults[current].hz, 0) / wasmResultNames.length;
            const wasmRme = wasmResultNames.reduce((memo, current) => memo + browserResults[current].stats.rme, 0) / wasmResultNames.length;
            const emccAvg = emccResultNames.reduce((memo, current) => memo + browserResults[current].hz, 0) / emccResultNames.length;

            testCase.results[browserId] = { js: jsAvg, jsRme: jsRme, wasm: wasmAvg, wasmRme: wasmRme, emcc: emccAvg };
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

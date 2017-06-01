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
        values: { },
        caseNames: visibleCases.map(testCase => testCase.name)
    };

    for (const browser of visibleBrowsers) {
        const browserResults = result.values[browser.name] = [];
        for (const testCase of visibleCases) {
            browserResults.push(testCase.results[browser.id].wasm / testCase.results[browser.id].js * 100);
        }
    }

    return result;
}

function renderTable(chartData) {
    const visibleBrowsers= chartData.browsers.filter(isVisible);
    const visibleTestCases = chartData.testCases.filter(isVisible);

    const table = document.querySelector("#results-table");
    removeChildNodes(table);

    const headerRow = document.createElement("tr");
    const subtitleRow = document.createElement("tr");
    const titles = ["Test Case", ...visibleBrowsers.map(browser => browser.name + " " + browser.version)];

    for (const title of titles) {
        const titleCell = document.createElement("th");
        titleCell.innerText = title;

        headerRow.appendChild(titleCell);
        if (title !== titles[0]) {
            titleCell.colSpan = 2;

            for (const subTitle of ["Speedy.js", "JS"]) {
                const langCell = document.createElement("th");
                langCell.innerText = subTitle;
                subtitleRow.appendChild(langCell);
            }
        } else {
            subtitleRow.appendChild(document.createElement("th"));
            titleCell.colSpan = 1;
        }
    }

    const header = document.createElement("thead");
    header.appendChild(headerRow);
    header.appendChild(subtitleRow);
    table.appendChild(header);

    const body = document.createElement("tbody");

    for (const testCase of visibleTestCases) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.innerText = testCase.name;
        row.appendChild(nameCell);

        for (const browser of visibleBrowsers) {
            const speedyJsCell = document.createElement("td");
            speedyJsCell.innerText = testCase.results[browser.id].wasm.toFixed(2);
            row.append(speedyJsCell);

            const jsCell = document.createElement("td");
            jsCell.innerText = testCase.results[browser.id].js.toFixed(2);
            row.append(jsCell);
        }

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

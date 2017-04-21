import * as d3 from "d3";

interface Measurement {
    js: number;
    wasm: number;
}

interface TestCase {
    name: string;
    results: { [browserId: string ]: Measurement };
}

interface BarChartData {
    testCases: TestCase[];
    browsers: { name: string, id: string }[];
}

/**
 * Creates a new chart instance that renders into the given svg element
 * @param svgElementQuery string | HtmlElement the svg element into which the chart is to be rendered
 */
function createChart(svgElementQuery) {
    const svg = d3.select(svgElementQuery);

    const margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /**
     * The overall x axis by test case name
     */
    const x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1);

    /**
     * The sub x axis per group. The keys are the browser names
     */
    const xPerCase = d3.scaleBand()
        .padding(0.05);

    const y = d3.scaleLinear()
        .rangeRound([height, 0]);

    const z = d3.scaleOrdinal<string>(d3.schemeCategory10);


    /**
     * Renders the chart
     * @param data the results to render.
     */
    return function render(data: BarChartData) {
        function renderYAxis() {
            const yAxis = d3.axisLeft(y)
                .ticks(10, "%");
            g.append("g")
                .attr("class", "axis y-axis")
                .call(yAxis)
                .append("text")
                .attr("y", 10)
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .text("Speedup");
        }

        function renderLegend () {
            const legend = g.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(data.browsers.slice().reverse())
                .enter().append("g")
                .attr("transform", (browser, i) => "translate(0," + i * 20 + ")");

            legend.append("rect")
                .attr("x", width - 19)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", browser => z(browser.id));

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(browser => {
                    return browser.name;
                });
        }

        function testCaseToResults(testCase: TestCase) {
            return data.browsers.map(browser => { return { browserId: browser.id, percentage: testCase.results[browser.id].wasm / testCase.results[browser.id].js }; });
        }

        x.domain(data.testCases.map(testCase => testCase.name).sort());
        xPerCase.domain(data.browsers.map(browser => browser.id))
            .rangeRound([0, x.bandwidth()]);
        y.domain([0, d3.max(data.testCases, testCase => d3.max(data.browsers, browser => testCase.results[browser.id].wasm / testCase.results[browser.id].js))]).nice();

        const cases =  g
            .append("g")
            .selectAll("g")
            .data(data.testCases);

        const casesEnter = cases.enter()
            .append("g")
            .attr("transform", testCase => { return "translate(" + x(testCase.name) + ",0)"; });

        // render the bars
        const bars = casesEnter
            .selectAll("rect")
            .data(testCaseToResults);

        const percentFormat = d3.format(".0%");
        const barsEnter = bars
            .enter()
            .append("g")
                .attr("transform", wasmResult =>  `translate(${xPerCase(wasmResult.browserId)}, ${y(wasmResult.percentage)})`);
        barsEnter
            .append("rect")
            .attr("class", "bar")
            .attr("width", xPerCase.bandwidth())
            .attr("height", wasmResult => height - y(wasmResult.percentage))
            .attr("fill", wasmResult => z(wasmResult.browserId));
        barsEnter
            .append("text")
            .attr("class", "bar-label")
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .attr("x", wasmResult => y(wasmResult.percentage) - height + 20)
            .attr("y", wasmResult => xPerCase.bandwidth() / 2 + 2.5)
            .attr("font-size", "11px")
            .attr("transform", "rotate(-90)")
            .text(wasmResult => percentFormat(wasmResult.percentage));


        // render the x-axis
        g.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        renderYAxis();
        renderLegend();

        // draw 100% line
        g.append("line")
            .attr("x1", x.range()[0])
            .attr("y1", y(1) + 0.75)
            .attr("x2", x.range()[1])
            .attr("y2", y(1) + 0.75)
            .attr("stroke-width", 1.5)
            .attr("stroke", "black");
    };
}


export = createChart;

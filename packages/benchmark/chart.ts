import * as d3 from "d3";
import * as d3Tip from "d3-tip";

interface Measurement {
    js: number;
    wasm: number;
    emcc: number;
}

interface TestCase {
    name: string;
    results: { [browserId: string ]: Measurement };
}

interface BarChartData {
    testCases: TestCase[];
    browsers: { name: string, id: string, version: string }[];
}

const TRANSITION_DURATION = 300;

/**
 * Creates a new chart instance that renders into the given svg element
 * @param svgElementQuery string | HtmlElement the svg element into which the chart is to be rendered
 */
function createChart(svgElementQuery) {
    const target = d3.select(svgElementQuery);

    const margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = +target.attr("width") - margin.left - margin.right,
        height = +target.attr("height") - margin.top - margin.bottom;

    target.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

    const yAxis = d3.axisLeft(y)
        .ticks(10, "%");

    const z = d3.scaleOrdinal(d3.schemeCategory10);

    const opsFormat = d3.format(".2f");
    const tip = d3Tip()
        .attr('class', 'tooltip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Ops/s:</strong> <span style='color:red'>" + opsFormat(d.ops) + "</span>";
        });

    target.call(tip);

    let staticRendered = false;

    function renderStatic() {
        const container = target.select("g");

        function renderYAxis() {
            container.append("g")
                .attr("class", "axis y-axis")
                .append("text")
                .attr("y", 10)
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .text("Speedup");
        }

        function renderLegendBox () {
            const legend = container.append("g")
                .attr("class", "legend-box")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end");
        }

        function renderXAxis() {
            container.append("g")
                .attr("class", "axis x-axis")
                .attr("transform", "translate(0," + height + ")");
        }

        container.append("g")
            .attr("class", "cases");

        container.append("line")
            .attr("class", "hundred-percent")
            .attr("x1", x.range()[0])
            .attr("x2", x.range()[1])
            .attr("y1", height)
            .attr("y2", height)
            .attr("stroke-width", 1.5)
            .attr("stroke", "black");

        renderXAxis();
        renderYAxis();
        renderLegendBox();

        staticRendered = true;
    }

    function renderData(data: BarChartData) {
        const container = target.select("g");

        function updateLegend() {
            let legends = container
                .select("g.legend-box")
                .selectAll("g.legend")
                .data(data.browsers);

            const legendsEnter = legends
                .enter()
                .append("g")
                .attr("class", "legend")
                .attr("transform", (browser, i) => "translate(" + width + "," + i * 20 + ")");

            // enter and update
            const legendsMerged = legends.merge(legendsEnter).transition().duration(TRANSITION_DURATION);
            legendsMerged.attr("transform", (browser, i) => "translate(0," + i * 20 + ")");

            legendsEnter.append("rect")
                .attr("x", width - 19)
                .attr("width", 19)
                .attr("height", 19);

            legendsMerged.select("rect").attr("fill", browser => z(browser.id));

            legendsEnter.append("text")
                .attr("x", width - 24)
                .attr("y", 9.5)
                .attr("dy", "0.32em");

            legendsMerged.select("text")
                .text(browser =>  browser.name + " " + browser.version);

            legends.exit().remove();
        }

        function testCaseToResults(testCase: TestCase) {
            return data.browsers.map(browser => {
                return {
                    browserId: browser.id,
                    percentage: testCase.results[browser.id].wasm / testCase.results[browser.id].js,
                    emccPercentage: testCase.results[browser.id].emcc / testCase.results[browser.id].js,
                    ops: testCase.results[browser.id].wasm
                };
            });
        }

        function updateAxises() {
            x.domain(data.testCases.map(testCase => testCase.name));
            xPerCase.domain(data.browsers.map(browser => browser.id))
                .rangeRound([0, x.bandwidth()]);

            y.domain([0, d3.max(data.testCases, testCase => d3.max(data.browsers, browser => testCase.results[browser.id].wasm / testCase.results[browser.id].js))]).nice();

            // update the x-axis
            container.select("g.x-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisBottom(x));

            container.select("g.y-axis")
                .transition()
                .duration(TRANSITION_DURATION)
                .call(d3.axisLeft(y)
                    .ticks(10, "%"));
        }

        updateAxises();

        let cases =  container
            .select("g.cases")
            .selectAll("g.test-case")
            .data(data.testCases);

        const casesEnter = cases.enter()
            .append("g")
            .attr("class", "test-case");

        cases = cases.merge(casesEnter)
            .attr("transform", testCase => { return "translate(" + x(testCase.name) + ",0)"; });

        // render the bars
        const bars = cases
            .selectAll("g.bar")
            .data(testCaseToResults);

        const barsEnter = bars
            .enter()
            .append("g")
            .attr("class", "bar");

        const barsMerged = bars.merge(barsEnter)
            .attr("transform", wasmResult =>  `translate(${xPerCase(wasmResult.browserId)}, 0)`);

        barsEnter
            .append("rect")
            .attr("class", "bar")
            .attr("y", height)
            .attr("height", 0);

        barsMerged.select("rect")
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide)
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("fill", wasmResult => z(wasmResult.browserId))
            .attr("y", wasmResult => y(wasmResult.percentage))
            .attr("width", xPerCase.bandwidth())
            .attr("height", wasmResult => height - y(wasmResult.percentage));

        const percentFormat = d3.format(".0%");

        barsEnter
            .append("text")
            .attr("class", "bar-label")
            .attr("fill", "white")
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("transform", "rotate(-90)")
            .text(percentFormat(0))
            .attr("x", wasmResult => -height + 20)
            .attr("y", wasmResult => xPerCase.bandwidth() / 2 + 2.5);

        barsMerged.select("text")
            .transition()
            .duration(TRANSITION_DURATION)
            .text(wasmResult => percentFormat(wasmResult.percentage));

        barsEnter
            .append("line")
            .attr("class", "emcc")
            .attr("stroke", z("emcc"))
            .attr("stroke-width", 2);

        barsMerged.select("line")
            .attr("x1", 0)
            .attr("y1", wasmResult => y(wasmResult.emccPercentage))
            .attr("x2", xPerCase.bandwidth())
            .attr("y2", wasmResult => y(wasmResult.emccPercentage));

        bars.exit().remove();
        cases.exit().remove();

        updateLegend();

        container.select("line.hundred-percent")
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("y1", y(1) + 0.75)
            .attr("y2", y(1) + 0.75);
    }

    /**
     * Initial rendering of the chart
     * @param data the results to render.
     */
    function render(data: BarChartData) {
        if (!staticRendered) {
            renderStatic();
        }

        update(data);
    }

    function update(data: BarChartData) {
        renderData(data);
    }

    return {
        render: render,
        update: update
    }
}

export = createChart;

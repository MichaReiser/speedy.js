import {Random} from "./simjs";

export class Project {
    constructor(public startYear: int, public totalAmount: number) {}
}

export class SubBucket {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;
    empty = true;
}

export class Bucket {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;

    /**
     * The sub buckets. The index of the sub bucket is the group to which it belongs
     * The index is a group index
     */
    subBuckets = [
        new SubBucket(),
        new SubBucket(),
        new SubBucket(),
        new SubBucket()
    ];
}

export enum GroupIndex {
    GREEN = 0,
    YELLOW = 1,
    GRAY = 2,
    RED = 3
}

export class Group {

    /**
     * The index of the group. Can be used to locate sub buckets
     */
    groupIndex: GroupIndex;

    /**
     * Should a separator line been drawn for this group?
     */
    separator: boolean;

    /**
     * Whats the percentage of values in this group to the total number of simulated values
     */
    percentage = 0.0;

    /**
     * Whats the minimum value that is still part of this group
     */
    from?: number;
    /**
     * Whats the maximum value (exclusive) that defines the upper end of this group
     */
    to?: number;

    /**
     * Number of values in this group
     */
    count = 0;

    constructor(index: GroupIndex, from?: number, to?: number, separator = true) {
        this.groupIndex = index;
        this.from = from;
        this.to = to;
        this.separator = separator;
    }
}

export class MinMax {
    constructor(public min: number, public max: number) {}
}

export class ProjectResult {
    /**
     * The minimal simulated value for this project
     */
    min: number;
    /**
     * The maximal simulated value
     */
    max: number;

    /** The median of the values found for this project
     */
    median: number;

    /**
     * Defines where the 2/3 of the simulated values start / end.
     */
    twoThird: MinMax;

    buckets: Bucket[];

    groups: Group[];

    constructor(public project: Project) {}
}

class Simulation {
    investmentAmount: number;
    liquidity: number;
    noInterestReferenceLine: number[] = [];
    numRuns: int;
    projectsByStartYear: { [year: number]: Project[] };
    simulatedValues: number[][];
}

class SimulationOptions {
    investmentAmount = 1000000;
    liquidity = 10000;
    numRuns = 10000;
    numYears = 10;
    performance = 0;
    projects: Project[] = [];
    seed: int | undefined = undefined;
    volatility = 0.01;
}

function toAbsoluteIndices(indices: number[], cashFlows: number[], investmentAmount: number) {
    const absolute = new Array<number>(indices.length);
    let currentPortfolioValue = investmentAmount;
    let previousYearIndex = 100.0;

    for (let relativeYear = 0; relativeYear < indices.length; ++relativeYear) {
        const currentYearIndex = indices[relativeYear];
        const cashFlowStartOfYear = relativeYear === 0 ? 0 : cashFlows[relativeYear - 1];

        // scale current value with performance gain according to index
        const performance = currentYearIndex / previousYearIndex;
        currentPortfolioValue = (currentPortfolioValue + cashFlowStartOfYear) * performance;

        absolute[relativeYear] = Math.round(currentPortfolioValue);
        previousYearIndex = currentYearIndex;
    }

    return absolute;
}

function simulateSingleAbsoluteOutcome(numYears: number, cashFlows: number[], options: SimulationOptions, random: Random) {
    const indices = new Array<number>(numYears + 1);
    indices[0] = 100;

    for (let i = 0; i < numYears; ++i) {
        const randomPerformance = 1 + random.normal(options.performance, options.volatility);
        indices[i + 1] = indices[i] * randomPerformance;
    }

    // convert the relative values from above to absolute values.
    return toAbsoluteIndices(indices, cashFlows, options.investmentAmount);
}

/**
 * Performs the monte carlo simulation for all years and num runs.
 * @param cashFlows the cash flows
 * @param numYears the number of years to simulate
 * @returns {number[][]} the simulated outcomes grouped by year
 */
function simulateOutcomes(cashFlows: number[], numYears: int, options: SimulationOptions): number[][]  {
    const random = new Random(10);

    const result: number[][] = new Array(numYears);
    for (let year = 0; year <= numYears; ++year) {
        result[year] = new Array(options.numRuns);
    }

    for (let run = 0; run < options.numRuns; ++run) {
        const indices = simulateSingleAbsoluteOutcome(numYears, cashFlows, options, random);

        for (let year = 0; year < indices.length; ++year) {
            result[year][run] = indices[year];
        }
    }

    return result;
}

function projectsToCashFlows(numYears: number, projectsByStartYear: Project[][]) {
    const cashFlows: number[] = [];
    for (let year = 0; year <= numYears; ++year) {
        const projectsByThisYear = projectsByStartYear[year] || [];
        const cashFlow = -projectsByThisYear.reduce((memo, project) => memo + project.totalAmount, 0.0);
        cashFlows.push(cashFlow);
    }
    return cashFlows;
}


function calculateNoInterestReferenceLine(cashFlows: number[], numYears: number, investmentAmount: number) {
    const noInterestReferenceLine: number[] = [];

    let investmentAmountLeft = investmentAmount;
    for (let year = 0; year <= numYears; ++year) {
        investmentAmountLeft = investmentAmountLeft + cashFlows[year];
        noInterestReferenceLine.push(investmentAmountLeft);
    }
    return noInterestReferenceLine;
}

function performSimulation(options: SimulationOptions): Simulation {
    const projectsToSimulate: Project[] = options.projects;
    const projects = options.projects.sort((a, b) => a.startYear - b.startYear);

    // Group projects by startYear, use lodash groupBy instead
    const projectsByStartYear: Project[][] = [];
    for (const project of projects) {
        const arr = projectsByStartYear[project.startYear] = projectsByStartYear[project.startYear] || [];
        arr.push(project);
    }

    const numYears = projectsToSimulate.reduce((memo, project) => Math.max(memo, project.startYear), 0);
    const cashFlows = projectsToCashFlows(numYears, projectsByStartYear);
    const noInterestReferenceLine = calculateNoInterestReferenceLine(cashFlows, numYears, options.investmentAmount);

    const simulation = new Simulation();
    simulation.investmentAmount = options.investmentAmount;
    simulation.liquidity = options.liquidity;
    simulation.noInterestReferenceLine = noInterestReferenceLine;
    simulation.numRuns = options.numRuns;
    simulation.projectsByStartYear = projectsByStartYear;
    simulation.simulatedValues = simulateOutcomes(cashFlows, numYears, options);

    return simulation;
}

function groupForValuePredicate(value) {
    "use speedyjs";

    return group => (group.from === undefined || group.from <= value) && (group.to === undefined || group.to > value);
}


function createGroups(requiredAmount: number, noInterestReference: number, liquidity: number): Group[] {
    return [
        new Group(GroupIndex.GREEN, requiredAmount, undefined, true),
        new Group(GroupIndex.YELLOW, requiredAmount - liquidity, requiredAmount),
        new Group(GroupIndex.GRAY, noInterestReference, requiredAmount - liquidity, false),
        new Group(GroupIndex.RED, undefined, noInterestReference, false)
    ];
}

function calculateRequiredAmount(project: Project, simulation: Simulation) {
    let amount = project.totalAmount;
    const projectsSameYear = simulation.projectsByStartYear[project.startYear];

    for (const otherProject of projectsSameYear) {
        if (otherProject === project) {
            break;
        }
        amount += otherProject.totalAmount;
    }
    return amount;
}

function median(values: number[]) {
    const half = Math.floor(values.length / 2);

    if (values.length % 2) {
        return values[half];
    }

    return (values[half - 1] + values[half]) / 2.0;
}

function computeBucket(bucketStart: number, bucketSize: number, simulatedValuesThisYear: number[], groups: Group[]) {
    const bucket = new Bucket();

    const bucketEnd = bucketStart + bucketSize;

    for (let j = bucketStart; j < bucketEnd; ++j) {
        const value = simulatedValuesThisYear[j];

        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);

        const group = groups.find(groupForValuePredicate(simulatedValuesThisYear[j]));
        ++group.count;

        const subBucket = bucket.subBuckets[group.groupIndex];
        subBucket.min = Math.min(subBucket.min, value);
        subBucket.max = Math.max(subBucket.max, value);
        subBucket.empty = false;
    }

    return bucket;
}

function computeBuckets(groups: Group[], simulatedValuesThisYear: number[]) {
    const NUMBER_OF_BUCKETS = 10;
    const bucketSize = Math.round(simulatedValuesThisYear.length / NUMBER_OF_BUCKETS) | 0;
    const buckets: Bucket[] = [];

    for (let i = 0; i < simulatedValuesThisYear.length; i += bucketSize) {
        const bucket = computeBucket(i, bucketSize, simulatedValuesThisYear, groups);

        buckets.push(bucket);
    }

    return buckets;
}

function compareNumbersInverse(a: number, b: number): number {
    return a - b;
}

function calculateProject(project: Project, simulation: Simulation): ProjectResult {
    const requiredAmount = calculateRequiredAmount(project, simulation);
    const simulatedValuesThisYear = simulation.simulatedValues[project.startYear];
    simulatedValuesThisYear.sort(compareNumbersInverse);

    const groups = createGroups(requiredAmount, simulation.noInterestReferenceLine[project.startYear], simulation.liquidity);
    const buckets = computeBuckets(groups, simulatedValuesThisYear);

    const nonEmptyGroups = groups.filter(group => group.count > 0);
    nonEmptyGroups.forEach(group => group.percentage = group.count / simulatedValuesThisYear.length);

    const oneSixth = Math.round(simulatedValuesThisYear.length / 6);
    const result = new ProjectResult(project);
    result.buckets = buckets;
    result.groups = nonEmptyGroups;
    result.max = simulatedValuesThisYear[simulatedValuesThisYear.length - 1];
    result.median = median(simulatedValuesThisYear);
    result.min = simulatedValuesThisYear[0];
    result.twoThird = new MinMax(simulatedValuesThisYear[oneSixth], simulatedValuesThisYear[simulatedValuesThisYear.length - oneSixth]);

    return result;
}

export function monteCarlo(options: Partial<SimulationOptions>) {
    const initializedOptions = new SimulationOptions();
    Object.assign(initializedOptions, options);

    const environment = performSimulation(initializedOptions);

    const results: ProjectResult[] = [];
    for (const project of options!.projects!) {
        results.push(calculateProject(project, environment));
    }

    return results;
}
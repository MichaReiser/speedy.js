import {Random} from "./simjs";

export interface IProject {
    startYear: int;
    totalAmount: number;
}

class SubBucket {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;
    empty = true;

    constructor(public group: string) {}
}

class Bucket {
    min = Number.MAX_SAFE_INTEGER;
    max = Number.MIN_SAFE_INTEGER;

    subBuckets = [
        new SubBucket("green"),
        new SubBucket("yellow"),
        new SubBucket("gray"),
        new SubBucket("red")
    ];
}

class Group {
    /**
     * The unique name of this group
     */
    name: string;

    /**
     * The index of the sub bucket
     */
    subBucketIndex: int;

    /**
     * The description of the group
     */
    description: string;

    /**
     * Should a separator line been drawn for this group?
     */
    separator: boolean;

    /**
     * Whats the percentage of values in this group to the total number of simulated values
     */
    percentage: number;

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

    constructor(index: int, name: string, description: string, from: number, to: number, percentage: number, separator: boolean) {
        this.subBucketIndex = index;
        this.name = name;
        this.description = description;
        this.from = from;
        this.to = to;
        this.percentage = percentage;
        this.separator = separator;
    }
}

export interface IProjectResult {
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
    twoThird: {
        min: number;
        max: number;
    };

    buckets: Bucket[];

    groups: Group[];

    /**
     * The project
     */
    project: IProject;
}

interface IMonteCarloEnvironment {
    investmentAmount: number;
    liquidity: number;
    noInterestReferenceLine: number[];
    numRuns: number;
    numYears: number;
    projectsByStartYear: { [year: number]: IProject[] };
    simulatedValues: number[][];
}

interface IMonteCarloSimulationOptions {
    numYears: int;
    numRuns: int;
    projects: IProject[];
    investmentAmount: number;
    performance: number;
    seed?: int;
    liquidity: number;
    volatility: number;
}

function initializeOptions(options?: Partial<IMonteCarloSimulationOptions>): IMonteCarloSimulationOptions {
    return Object.assign({}, {
        investmentAmount: 1000000,
        liquidity: 10000,
        numRuns: 10000,
        numYears: 10,
        performance: 0,
        projects: [],
        seed: undefined,
        volatility: 0.01
    }, options);
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

function simulateSingleAbsoluteOutcome(numYears: number, cashFlows: number[], options: IMonteCarloSimulationOptions, random: Random) {
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
function simulateOutcomes(cashFlows: number[], numYears: int, options: IMonteCarloSimulationOptions): number[][]  {
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

function createMonteCarloEnvironment(options: IMonteCarloSimulationOptions): IMonteCarloEnvironment {
    function projectsToCashFlows(numYears: number) {
        const cashFlows: number[] = [];
        for (let year = 0; year < numYears; ++year) {
            const projectsByThisYear = projectsByStartYear[year] || [];
            const cashFlow = -projectsByThisYear.reduce((memo, project) => memo + project.totalAmount, 0.0);
            cashFlows.push(cashFlow);
        }
        return cashFlows;
    }

    function calculateNoInterestReferenceLine(cashFlows: number[], numYears: number) {
        const noInterestReferenceLine: number[] = [];

        let investmentAmountLeft = options.investmentAmount;
        for (let year = 0; year < numYears; ++year) {
            investmentAmountLeft = investmentAmountLeft + cashFlows[year];
            noInterestReferenceLine.push(investmentAmountLeft);
        }
        return noInterestReferenceLine;
    }

    const projectsToSimulate: IProject[] = options.projects;
    const projects = options.projects.sort((a, b) => a.startYear - b.startYear);

    // Group projects by startYear, use lodash groupBy instead
    const projectsByStartYear: { [year: number]: IProject[] } = {};
    for (const project of projects) {
        const arr = projectsByStartYear[project.startYear] = projectsByStartYear[project.startYear] || [];
        arr.push(project);
    }

    const numYears = projectsToSimulate.reduce((memo, project) => Math.max(memo, project.startYear), 0);
    const cashFlows = projectsToCashFlows(numYears);
    const noInterestReferenceLine = calculateNoInterestReferenceLine(cashFlows, numYears);

    return {
        investmentAmount: options.investmentAmount,
        liquidity: options.liquidity,
        noInterestReferenceLine,
        numRuns: options.numRuns,
        numYears,
        projectsByStartYear,
        simulatedValues: simulateOutcomes(cashFlows, numYears, options)
    };
}

function groupForValue(value: number, groups: Group[]): Group {
    "use speedyjs";

    for (let i = 0; i < groups.length; ++i) {
        const group = groups[i];
        if ((!isNaN(group.from) || group.from <= value) && (!isNaN(group.to) || group.to > value)) {
            return group;
        }
    }

    return groups[0]!; // should never happen
}


function createGroups(requiredAmount: number, noInterestReference: number, environment: IMonteCarloEnvironment): Group[] {
    return [
        new Group(0, "green", "Ziel erreichbar", requiredAmount, NaN, 0.0, true),
        new Group(1, "yellow", "mit Zusatzliquidität erreichbar", requiredAmount - environment.liquidity, requiredAmount, 0.0, true),
        new Group(2, "gray", "nicht erreichbar", noInterestReference, requiredAmount - environment.liquidity, 0.0, false),
        new Group(3, "red", "nicht erreichbar, mit Verlust", NaN, noInterestReference, 0.0, false)
    ];
}

function calculateRequiredAmount(project: IProject, environment: IMonteCarloEnvironment) {
    let amount = project.totalAmount;
    const projectsSameYear = environment.projectsByStartYear[project.startYear];

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

function computeBucket(bucketStart: number, bucketSize: number, simulatedValuesThisYear: number[], groups: Group[], valuesByGroup: {[p: string]: number}) {
    const bucket = new Bucket();

    const bucketEnd = bucketStart + bucketSize;

    for (let j = bucketStart; j < bucketEnd; ++j) {
        const value = simulatedValuesThisYear[j];

        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);

        const group = groupForValue(simulatedValuesThisYear[j], groups);
        ++group.count;

        const subBucket = bucket.subBuckets[group.subBucketIndex];
        subBucket.min = Math.min(subBucket.min, value);
        subBucket.max = Math.max(subBucket.max, value);
        subBucket.empty = false;
    }

    return bucket;
}

function computeBuckets(groups: Group[], simulatedValuesThisYear: number[]) {
    const NUMBER_OF_BUCKETS = 10;
    const valuesByGroup: {[groupName: string]: number} = {
        green: 0,
        yellow: 0,
        gray: 0,
        red: 0
    };

    const bucketSize = Math.round(simulatedValuesThisYear.length / NUMBER_OF_BUCKETS) | 0;
    const buckets: Bucket[] = [];

    for (let i = 0; i < simulatedValuesThisYear.length; i += bucketSize) {
        const bucket = computeBucket(i, bucketSize, simulatedValuesThisYear, groups, valuesByGroup);

        buckets.push(bucket);
    }

    return { buckets, valuesByGroup };
}

function compareNumbersInverse(a: number, b: number): number {
    return a - b;
}

function calculateProject(project: IProject, environment: IMonteCarloEnvironment): IProjectResult {
    const requiredAmount = calculateRequiredAmount(project, environment);
    const simulatedValuesThisYear = environment.simulatedValues[project.startYear];
    simulatedValuesThisYear.sort(compareNumbersInverse);

    const groups = createGroups(requiredAmount, environment.noInterestReferenceLine[project.startYear], environment);
    const result = computeBuckets(groups, simulatedValuesThisYear);
    const buckets = result.buckets;
    const valuesByGroup = result.valuesByGroup;

    const nonEmptyGroups = groups.filter(group => !!valuesByGroup[group.name]);
    nonEmptyGroups.forEach(group => group.percentage = valuesByGroup[group.name] / simulatedValuesThisYear.length);

    const oneSixth = Math.round(simulatedValuesThisYear.length / 6);
    return {
        buckets,
        groups: nonEmptyGroups,
        max: simulatedValuesThisYear[simulatedValuesThisYear.length - 1],
        median: median(simulatedValuesThisYear),
        min: simulatedValuesThisYear[0],
        project,
        twoThird: {
            max: simulatedValuesThisYear[simulatedValuesThisYear.length - oneSixth],
            min: simulatedValuesThisYear[oneSixth]
        }
    };
}

export function monteCarlo(options?: Partial<IMonteCarloSimulationOptions>) {
    const environment = createMonteCarloEnvironment(initializeOptions(options));

    const projects: IProjectResult[] = [];
    for (const project of options!.projects!) {
        projects.push(calculateProject(project, environment));
    }

    return projects;
}
class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

async function emptyArrayLiteral(): Promise<int[]> {
    "use speedyjs";

    return [];
}

async function arrayFromLiteral() {
    "use speedyjs";
    return [1, 2, 3, 4, 5];
}

async function boolArrayJS2Wasm(array: boolean[]) {
    "use speedyjs";
    return array;
}

async function intArrayJS2Wasm(array: int[]) {
    "use speedyjs";
    return array;
}

async function numberArrayJS2Wasm(array: number[]) {
    "use speedyjs";
    return array;
}

async function newEmptyArray() {
    "use speedyjs";

    return new Array<boolean>();
}

async function newArrayOfObjects(x: number) {
    "use speedyjs";
    return [
        new Point(x, x),
        new Point(2.0 * x, 2.0 * x),
        new Point(3.0 * x, 3.0 * x),
        new Point(4.0 * x, 4.0 * x)
    ];
}

async function newArrayOfSize(size: int) {
    "use speedyjs";

    return new Array<number>(size);
}

async function newArrayWithElements(a: int, b: int, c: int) {
    "use speedyjs";

    return new Array<int>(a, b, c);
}

async function arrayGet(array: number[], index: int) {
    "use speedyjs";

    return array[index];
}

async function arraySet(array: number[], index: int, value: number) {
    "use speedyjs";

    array[index] = value;
    return array;
}

async function objectArrayElementAccess(x: number) {
    "use speedyjs";
    const array = [
        new Point(x, x),
        new Point(2.0 * x, 2.0 * x),
        new Point(3.0 * x, 3.0 * x),
        new Point(4.0 * x, 4.0 * x)
    ];

    const tmp = array[0];
    return tmp.x;
}

async function arrayFill(array: number[], value: number) {
    "use speedyjs";

    array.fill(value);

    return array;
}

async function arrayFillFromStart(array: number[], value: number, start: int) {
    "use speedyjs";

    array.fill(value, start);

    return array;
}

async function arrayFillInBetween(array: number[], value: number, start: int, end: int) {
    "use speedyjs";

    array.fill(value, start, end);

    return array;
}

async function arrayPush(array: boolean[], value: boolean) {
    "use speedyjs";

    array.push(value);
    return array;
}

async function arrayPushMultiple(array: boolean[], a: boolean, b: boolean, c: boolean) {
    "use speedyjs";

    array.push(a, b, c);
    return array;
}

async function arrayUnshift(array: int[], value: int) {
    "use speedyjs";

    array.unshift(value);
    return array;
}

async function arrayUnshiftMultiple(array: int[], a: int, b: int, c: int) {
    "use speedyjs";
    array.unshift(a, b, c);
    return array;
}

async function arrayPop(array: int[]) {
    "use speedyjs";

    return array.length - array.pop()!;
}

async function arrayShift() {
    "use speedyjs";

    const array = [1, 2, 3, 4];
    return array.length - array.shift()!;
}

async function arraySplice(array: int[], start: int) {
    "use speedyjs";

    array.splice(start);

    return array;
}

async function arraySpliceWithDeleteCount(array: int[], start: int, deleteCount: int) {
    "use speedyjs";

    array.splice(start, deleteCount);

    return array;
}

async function arraySpliceInsertingNewElements(array: int[], start: int, deleteCount: int, a: int, b: int, c: int, d: int) {
    "use speedyjs";

    array.splice(start, deleteCount, a, b, c, d);

    return array;
}

async function arraySpliceReturnedArray(array: int[]) {
    "use speedyjs";

    return array.splice(2);
}

async function arraySliceCompleteArray(array: int[]) {
    "use speedyjs";

    return array.slice();
}

async function arraySliceFrom(array: int[], start: int) {
    "use speedyjs";

    return array.slice(start);
}

async function arraySliceInBetween(array: int[], start: int, end: int) {
    "use speedyjs";

    return array.slice(start, end);
}

async function boolArraySort(array: boolean[]) {
    "use speedyjs";

    return array.sort();
}

async function intArraySort(array: int[]) {
    "use speedyjs";

    return array.sort();
}

async function numberArraySort(array: number[]) {
    "use speedyjs";

    return array.sort();
}

function sortByXCoordinate(a: Point, b: Point) {
    "use speedyjs";

    return a.x - b.x as number;
}

async function objectArraySortByX(array: Point[]) {
    "use speedyjs";

    return array.sort(sortByXCoordinate);
}

describe("Array", () => {

    describe("[]", () => {
        it("creates an empty array", async (cb) => {
            expect(await emptyArrayLiteral()).toEqual([] as int[]);
            cb();
        });

        it("creates an array with the elements specified in the array literal", async (cb) => {
            expect(await arrayFromLiteral()).toEqual([1, 2, 3, 4, 5]);
            cb();
        });
    });

    describe("new Array", () => {
        it("creates an empty array if called without any arguments", async (cb) => {
            expect(await newEmptyArray()).toEqual([]);
            cb();
        });

        it("creates an array with the specified length", async (cb) => {
            expect(await newArrayOfSize(10)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            cb();
        });

        it("creates an array containing the specified elements", async (cb) => {
            expect(await newArrayWithElements(10, 20, 30)).toEqual([10, 20, 30]);
            cb();
        });

        it("creates an array containing objects", async (cb) => {
            expect(await newArrayOfObjects(10)).toEqual([
                new Point(10, 10),
                new Point(20, 20),
                new Point(30, 30),
                new Point(40, 40)
            ]);

            cb();
        });
    });

    describe("array[x]", () => {
        it("gets the value at the given index", async (cb) => {
            expect(await arrayGet([1, 2, 3, 4], 2)).toBe(3);
            cb();
        });

        it("sets the value at the given index", async (cb) => {
            expect(await arraySet([1, 2, 3, 4], 2, 10)).toEqual([1, 2, 10, 4]);
            cb();
        });

        it("returns the object at the given address", async (cb) => {
            expect(await objectArrayElementAccess(10)).toBe(10);
            cb();
        });
    });

    describe("wasm2js conversion", () => {
        it("converts the JS boolean array to a WASM boolean array and vice versa", async (cb) => {
            expect(await boolArrayJS2Wasm([true, false, true, true, false])).toEqual([true, false, true, true, false]);
            cb();
        });

        it("converts the JS int array to a WASM int array and vice versa", async (cb) => {
            expect(await intArrayJS2Wasm([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
            cb();
        });

        it("converts the JS number array to a WASM double array and vice versa", async (cb) => {
            expect(await numberArrayJS2Wasm([1.1, 2.2, 3.3, 4.4, 5.5])).toEqual([1.1, 2.2, 3.3, 4.4, 5.5]);
            cb();
        });
    });

    describe("fill", () => {
        it("fills the array with the specified value from 0 to end", async (cb) => {
            expect(await arrayFill(new Array<number>(10), 1.5)).toEqual([1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5]);
            cb();
        });

        it("fills the array with the specified value from the specified start up to the array end", async (cb) => {
            expect(await arrayFillFromStart(new Array<number>(10), 2.0, 3)).toEqual([NaN, NaN, NaN, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0]);
            cb();
        });

        it("fills the array with the specified value between the defined start and end positions", async (cb) => {
            expect(await arrayFillInBetween(new Array<number>(10), 2.0, 3, 8)).toEqual([NaN, NaN, NaN, 2.0, 2.0, 2.0, 2.0, 2.0, NaN, NaN]);
            cb();
        });
    });

    describe("push", () => {
        it("inserts the new element at the end of the array", async (cb) => {
            const pushed = await arrayPush([true, false], true);
            expect(pushed).toEqual([true, false, true]);
            cb();
        });

        it("inserts all elements at the end of the array", async (cb) => {
            const pushed = await arrayPushMultiple([true, false], true, false, true);
            expect(pushed).toEqual([true, false, true, false, true]);
            cb();
        });
    });

    describe("unshift", () => {
        it("inserts the element at the start of the array", async (cb) => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const unshifted = await arrayUnshift(array, 0);
            expect(unshifted).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            cb();
        });

        it("inserts all the elements at the beginning of the array", async (cb) => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const unshifted = await arrayUnshiftMultiple(array, -2, -1, 0);
            expect(unshifted).toEqual([-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            cb();
        });
    });

    describe("pop", () => {
        it("removes and returns the last element", async (cb) => {
            expect(await arrayPop([1, 2, 3, 4])).toBe(0);
            cb();
        });
    });

    describe("shift", () => {
        it("removes and returns the first element", async (cb) => {
            expect(await arrayShift()).toBe(3);
            cb();
        });
    });

    describe("sort", () => {
        it("sorts the boolean array ascending", async (cb) => {
            expect(await boolArraySort([true, false, true, true, false])).toEqual([false, false, true, true, true]);
            cb();
        });

        it("sorts the int array ascending", async (cb) => {
            expect(await intArraySort([2, 5, 1, 13, 8])).toEqual([1, 2, 5, 8, 13]);
            cb();
        });

        it("sorts the number array ascending", async (cb) => {
            expect(await numberArraySort([12.3, 83.3, 213.2, 11.2, 93.2])).toEqual([11.2, 12.3, 83.3, 93.2, 213.2]);
            cb();
        });
    });

    describe("splice", () => {
        it("removes all elements from the given start index if delete count is not defined", async (cb) => {
            expect(await arraySplice([1, 2, 3, 4, 5], 2)).toEqual([1, 2]);
            cb();
        });

        it("removes deleteCount num elements from the specified start index", async (cb) => {
            expect(await arraySpliceWithDeleteCount([1, 2, 3, 4, 5], 2, 2)).toEqual([1, 2, 5]);
            cb();
        });

        it("inserts the new elements", async (cb) => {
            expect(await arraySpliceInsertingNewElements([1, 2, 3, 4, 5], 2, 2, 10, 11, 12, 13)).toEqual([1, 2, 10, 11, 12, 13, 5]);
            cb();
        });

        it("returns an array containing the removed elements", async (cb) => {
            expect(await arraySpliceReturnedArray([1, 2, 3, 4, 5])).toEqual([3, 4, 5]);
            cb();
        });
    });

    describe("slice", () => {
        it("returns an array containing all elements if called without any arguments", async (cb) => {
            expect(await arraySliceCompleteArray([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
            cb();
        });

        it("returns a subset of the array containing the elements from the specified start", async (cb) => {
            expect(await arraySliceFrom([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
            expect(await arraySliceFrom([1, 2, 3, 4, 5], -2)).toEqual([4, 5]);
            expect(await arraySliceFrom([1, 2, 3, 4, 5], 5)).toEqual([]);
            cb();
        });

        it("returns the elements in between the specified start and end", async (cb) => {
            expect(await arraySliceInBetween([1, 2, 3, 4, 5], 2, 4)).toEqual([3, 4]);
            expect(await arraySliceInBetween([1, 2, 3, 4, 5], 2, -1)).toEqual([3, 4]);
            expect(await arraySliceInBetween([1, 2, 3, 4, 5], 5, 1)).toEqual([]);
            cb();
        });
    });
});

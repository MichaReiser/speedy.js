class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

async function emptyArrayLiteral(): Promise<int> {
    "use speedyjs";

    const array: int[] = [];
    return array.length;
}

async function arrayFromLiteral(index: int) {
    "use speedyjs";
    const array = [1, 2, 3, 4, 5];
    return array[index];
}

async function newEmptyArray() {
    "use speedyjs";

    return new Array<boolean>().length;
}

async function newArrayOfObjects(x: number) {
    "use speedyjs";
    const array = [
        new Point(x, x),
        new Point(2.0*x, 2.0*x),
        new Point(3.0*x, 3.0*x),
        new Point(4.0*x, 4.0*x)
    ];

    return array.length;
}

async function newArrayOfSize(size: int) {
    "use speedyjs";

    return new Array<number>(size).length;
}

async function newArrayWithElements(a: int, b: int, c: int) {
    "use speedyjs";

    return new Array<int>(a, b, c).length;
}

async function arrayElementAccess(index: int, value: number) {
    "use speedyjs";

    const array = new Array<number>(index * 2);
    array[index] = value;
    return array[index];
}

async function objectArrayElementAccess(x: number) {
    "use speedyjs";
    const array = [
        new Point(x, x),
        new Point(2.0*x, 2.0*x),
        new Point(3.0*x, 3.0*x),
        new Point(4.0*x, 4.0*x)
    ];

    const tmp = array[0];
    return tmp.x;
}

async function arrayFill(size: int, value: number) {
    "use speedyjs";

    const array = new Array<number>(size);
    array.fill(value);

    return array[0] + array[array.length - 1];
}

async function arrayFillFromStart(size: int, value: int, start: int) {
    "use speedyjs";

    const array = new Array<int>(size);
    array.fill(value, start);

    return array[0] + array[start - 1] + array[start] + array[array.length - 1];
}

async function arrayFillInBetween(size: int, value: number, start: int, end: int) {
    "use speedyjs";

    const array = new Array<number>(size);
    array.fill(value, start, end);

    return array[0] + array[start - 1] + array[start] + array[end - 1] + array[end];
}

async function arrayPush(value: boolean) {
    "use speedyjs";

    const array = new Array<boolean>(10);
    const previousLength = array.length;
    array.push(value);
    return array[previousLength];
}

async function arrayPushMultiple(a: boolean, b: boolean, c: boolean) {
    "use speedyjs";

    const array = new Array<boolean>(10);
    const previousLength = array.length;
    array.push(a, b, c);
    return array.length - previousLength;
}

async function arrayUnshift(value: int) {
    "use speedyjs";

    const array = new Array<int>(10);
    array.unshift(value);
    return array[0];
}

async function arrayUnshiftMultiple(a: int, b: int, c: int) {
    "use speedyjs";

    const array = new Array<int>(10);
    const previousLength = array.length;
    array.unshift(a, b, c);
    return array.length - previousLength;
}

async function arrayPop() {
    "use speedyjs";

    const array = [1, 2, 3, 4];
    return array.length - array.pop()!;
}

async function arrayShift() {
    "use speedyjs";

    const array = [1, 2, 3, 4];
    return array.length - array.shift()!;
}

async function arraySplice() {
    "use speedyjs";
    
    const array = [1, 2, 3, 4, 5];
    array.splice(2);
    
    return array.length;
}

async function arraySpliceWithDeleteCount() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    array.splice(2, 2);

    return array.length;
}

async function arraySpliceInsertingNewElements() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    array.splice(2, 2, 10, 11, 12, 13, 14);

    return array.length;
}

async function arraySpliceReturnedArray() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    return array.splice(2).length;
}

async function arraySliceCompleteArray() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    return array.slice().length;
}

async function arraySliceFrom(start: int) {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    return array.slice(start).length;
}

async function arraySliceInBetween(start: int, end: int) {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    return array.slice(start, end).length;
}

describe("Array", () => {
    describe("[]", () => {
        it("creates an empty array", async (cb) => {
            expect(await emptyArrayLiteral()).toBe(0);
            cb();
        });

        it("creates an array with the elements specified in the array literal", async (cb) => {
            expect(await arrayFromLiteral(0)).toBe(1);
            expect(await arrayFromLiteral(1)).toBe(2);
            expect(await arrayFromLiteral(2)).toBe(3);
            expect(await arrayFromLiteral(3)).toBe(4);
            expect(await arrayFromLiteral(4)).toBe(5);
            cb();
        });
    });

    describe("new Array", () => {
        it("creates an empty array if called without any arguments", async (cb) => {
            expect(await newEmptyArray()).toBe(0);
            cb();
        });

        it("creates an array with the specified length", async (cb) => {
            expect(await newArrayOfSize(10000)).toBe(10000);
            cb();
        });

        it("creates an array containing the specified elements", async (cb) => {
            expect(await newArrayWithElements(10, 20, 30)).toBe(3);
            cb();
        });

        it("creates an array containing objects", async(cb) => {
            expect(await newArrayOfObjects(10)).toBe(4);
            cb();
        });
    });

    describe("array[x]", () => {
        it("sets and returns the value at the given index", async (cb) => {
            expect(await arrayElementAccess(40, 1000)).toBe(1000);
            cb();
        });

        it("returns the object at the given address", async(cb) => {
            expect(await objectArrayElementAccess(10)).toBe(10);
            cb();
        });
    });

    describe("fill", () => {
        it("fills the array with the specified value from 0 to end", async (cb) => {
            expect(await arrayFill(100, 1.5)).toBe(3);
            cb();
        });

        it("fills the array with the specified value from the specified start to the end", async (cb) => {
            expect(await arrayFillFromStart(100, 10, 30)).toBe(0 + 0 + 10 + 10);
            cb();
        });

        it("fills the array with the specified value between the defined start and end positions", async (cb) => {
            expect(await arrayFillInBetween(100, 10, 30, 80)).toBe(0 + 0 + 10 + 10 + 0);
            cb();
        });
    });

    describe("push", () => {
        it("inserts the new element at the end of the array", async (cb) => {
            expect(await arrayPush(true)).toBe(true);
            cb();
        });

        it("inserts all elements at the end of the array", async (cb) => {
            expect(await arrayPushMultiple(true, false, true)).toBe(3);
            cb();
        });
    });

    describe("unshift", () => {
        it("inserts the element at the start of the array", async (cb) => {
            expect(await arrayUnshift(10)).toBe(10);
            cb();
        });

        it("inserts all the elements at the begining of the array", async (cb) => {
            expect(await arrayUnshiftMultiple(1, 2, 3)).toBe(3);
            cb();
        });
    });

    describe("pop", () => {
        it("removes and returns the last element", async (cb) => {
            expect(await arrayPop()).toBe(-1);
            cb();
        });
    });

    describe("shift", () => {
        it("removes and returns the first element", async (cb) => {
            expect(await arrayShift()).toBe(2);
            cb();
        });
    });
    
    describe("splice", () => {
        it("removes all elements from the given start index if delete count is not defined", async (cb) => {
            expect(await arraySplice()).toBe(2);
            cb();
        });

        it("removes deleteCount num elements from the specified start index", async (cb) => {
            expect(await arraySpliceWithDeleteCount()).toBe(3);
            cb();
        });

        it("inserts the new elements", async (cb) => {
            expect(await arraySpliceInsertingNewElements()).toBe(8);
            cb();
        });

        it("returns an array containing the removed elements", async (cb) => {
            expect(await arraySpliceReturnedArray()).toBe(3);
            cb();
        });
    });

    describe("slice", () => {
        it("returns an array containing all elements if called without any arguments", async (cb) => {
            expect(await arraySliceCompleteArray()).toBe(5);
            cb();
        });

        it("returns a subset of the array containing the elements from the specified start", async (cb) => {
            expect(await arraySliceFrom(2)).toBe(3);
            expect(await arraySliceFrom(-2)).toBe(2);
            expect(await arraySliceFrom(5)).toBe(0);
            cb();
        });

        it("returns the elements in between the specified start and end", async (cb) => {
            expect(await arraySliceInBetween(2, 4)).toBe(2);
            expect(await arraySliceInBetween(2, -1)).toBe(2);
            expect(await arraySliceInBetween(5, 1)).toBe(0);
            cb();
        });
    });
});

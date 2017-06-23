function filter(array: int[], predicate: (value: int) => boolean) {
    "use speedyjs";

    const result = new Array<int>();

    for (let i = 0; i < array.length; ++i) {
        if (predicate(array[i])) {
            result.push(array[i]);
        }
    }

    return result;
}

function isEven(num: int) {
    "use speedyjs";

    return num % 2 === 0;
}

async function getEvenNumbers(array: int[]) {
    "use speedyjs";

    return filter(array, isEven);
}

describe("Function References", () => {
    it("can invoke a function passed as argument", async (cb) => {
        expect(await getEvenNumbers([1, 2, 3, 4])).toEqual([2, 4]);
        cb();
    });
});

async function passesArray() {
    "use speedyjs";

    const array = [1, 2, 3, 4];
    return arrayLength(array);
}

function arrayLength(array: int[]) {
    "use speedyjs";

    return array.length;
}

async function variadicFunctionCall() {
    "use speedyjs";

    return max(1.2, 3.4, 3.498, 4.323, 3949.4);
}

function max(first: number, ...others: number[]) {
    "use speedyjs";

    let largest = first;

    for (let i = 0; i < others.length; ++i) {
        if (others[i] > largest) {
            largest = others[i];
        }
    }

    return largest;
}

describe("FunctionDeclaration", () => {
    describe("passing arrays", () => {
       it("arrays can be passed between speedyJS functions", async (cb) => {
            expect(await passesArray()).toBe(4);
            cb();
       });
    });

    describe("variadic functions", () => {
        it("converts the variadic arguments to an array", async (cb) => {
            expect(await variadicFunctionCall()).toBe(3949.4);
            cb();
        });
    });
});

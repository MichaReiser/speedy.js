async function passesArray() {
    "use speedyjs";

    const array = [1, 2, 3, 4];
    return arrayLength(array);
}

function arrayLength(array: int[]) {
    "use speedyjs";

    return array.length;
}

describe("FunctionDeclaration", () => {
    describe("passing arrays", () => {
       it("arrays can be passed between speedyJS functions", async function (cb) {
            expect(await passesArray()).toBe(4);
            cb();
       });
    });
});

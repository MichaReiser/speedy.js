async function intToNumber(value: int) {
    "use speedyjs";

    return value as number;
}

async function numberToInt(value: number) {
    "use speedyjs";

    return value as int;
}

describe("AsExpression", () => {
    describe("int as number", () => {
        it("converts the int to a number", async (cb) => {
            expect(await intToNumber(2)).toBe(2 as int);
            cb();
        });
    });

    describe("number as int", () => {
        it("converts the number to an int", async (cb) => {
             expect(await numberToInt(3.12)).toBe(3.12 | 0);
             expect(await numberToInt(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER | 0);
             cb();
        });
    });
});

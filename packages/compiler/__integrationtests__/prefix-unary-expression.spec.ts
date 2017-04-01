async function notBoolean(value: boolean) {
    "use speedyjs";
    return !value;
}

async function notInt(value: int) {
    "use speedyjs";

    return !value;
}

async function notNumber(value: number) {
    "use speedyjs";

    return !value;
}

async function negInt(value: int) {
    "use speedyjs";

    return -value;
}

async function negNumber(value: number): Promise<number> {
    "use speedyjs";

    return -value;
}

async function minusMinusInt(value: int) {
    "use speedyjs";
    --value;
    return value;
}

async function minusMinusNumber(value: number) {
    "use speedyjs";
    --value;
    return value;
}

async function plusPlusInt(value: int) {
    "use speedyjs";
    ++value;
    return value;
}

async function plusPlusNumber(value: number) {
    "use speedyjs";

    ++value;
    return value;
}

async function tildeBoolean(value: boolean) {
    "use speedyjs";
    return ~value;
}

async function tildeInt(value: int) {
    "use speedyjs";
    return ~value;
}

async function tildeNumber(value: number) {
    "use speedyjs";
    return ~value;
}

describe("PrefixUnaryExpression", () => {
    describe("!x", () => {
        it("returns false for true and true for false", async (cb) => {
            expect(await notBoolean(true)).toBe(!true);
            expect(await notBoolean(false)).toBe(!false);
            cb();
        });

        it("returns false for 0 and true otherwise", async (cb) => {
            expect(await notInt(0)).toBe(!0);
            expect(await notInt(1)).toBe(!1);
            expect(await notInt(-1)).toBe(!-1);
            cb();
        });

        // TODO should also return false for NaN
        it("returns false for 0 and true otherwise", async (cb) => {
            expect(await notNumber(0.0)).toBe(!0.0);
            expect(await notNumber(0.1)).toBe(!0.1);
            expect(await notNumber(-0.1)).toBe(!-0.1);
            cb();
        });
    });

    describe("-x", () => {
        it("returns the negative of the given integer value", async (cb) => {
            expect(await negInt(3)).toBe(-3);
            expect(await negInt(-3)).toBe(3);
            expect(await negInt(0)).toBe(0);
            cb();
        });

        it("returns the negative of the given number value", async (cb) => {
            expect(await negNumber(3.1)).toBe(-3.1);
            expect(await negNumber(-3.1)).toBe(3.1);
            expect(await negNumber(0)).toBe(0);
            cb();
        });
    });

    describe("--x", () => {
        it("subtracts one from the value of the int variable and returns the difference", async (cb) => {
            expect(await minusMinusInt(10)).toBe(9);
            expect(await minusMinusInt(-10)).toBe(-11);
            cb();
        });

        it("subtracts one from the value of the number variable and returns the difference", async (cb) => {
            expect(await minusMinusNumber(10.5)).toBe(9.5);
            expect(await minusMinusNumber(-9.5)).toBe(-10.5);
            cb();
        });
    });

    describe("++x", () => {
        it("adds one to the int variable and returns the sum", async (cb) => {
            expect(await plusPlusInt(10)).toBe(11);
            expect(await plusPlusInt(-10)).toBe(-9);
            cb();
        });

        it("adds one to the number variable and returns the sum", async (cb) => {
            expect(await plusPlusNumber(10.5)).toBe(11.5);
            expect(await plusPlusNumber(-10.5)).toBe(-9.5);
            cb();
        });
    });

    describe("~x", () => {
        it("returns the bitwise complement for the boolean value", async (cb) => {
            expect(await tildeBoolean(true)).toBe(~true);
            expect(await tildeBoolean(false)).toBe(~false);
            cb();
        });

        it("returns the bitwise complement for an int value", async (cb) => {
            expect(await tildeInt(0)).toBe(~0);
            expect(await tildeInt(2**31 - 1)).toBe(~(2**31 - 1));
            expect(await tildeInt(-(2**31 - 1))).toBe(~-(2**31 - 1));
            cb();
        });

        it("returns the bitwise complement for a number value", async (cb) => {
            expect(await tildeNumber(0.0)).toBe(~0);
            expect(await tildeNumber(2**31 - 1)).toBe(~(2**31 - 1));
            expect(await tildeNumber(-(2**31-1))).toBe(~-(2**31-1));

            expect(await tildeNumber(Number.MAX_SAFE_INTEGER)).toBe(~Number.MAX_SAFE_INTEGER);
            expect(await tildeNumber(Number.MIN_SAFE_INTEGER)).toBe(~Number.MIN_SAFE_INTEGER);
            cb();
        });
    });
});

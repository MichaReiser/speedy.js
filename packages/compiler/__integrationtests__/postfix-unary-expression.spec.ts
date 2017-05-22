class IntResultTuple {
    /**
     * @param result The result of the postfix operation
     * @param value the updated value
     */
    constructor(public result: int, public value: int) {}
}

class NumberResultTuple {
    /**
     * @param result The result of the postfix operation
     * @param value the updated value
     */
    constructor(public result: number, public value: number) {}
}

async function intMinusMinus(value: int) {
    "use speedyjs";
    return new IntResultTuple(value--, value);
}

async function numberMinusMinux(value: number) {
    "use speedyjs";
    return new NumberResultTuple(value--, value);
}

async function intPlusPlus(value: int) {
    "use speedyjs";
    return new IntResultTuple(value++, value);
}

async function numberPlusPlus(value: number) {
    "use speedyjs";
    return new NumberResultTuple(value++, value);
}

describe("PostfixUnaryExpression", () => {
    describe("x--", () => {
        it("returns the int value and subtracts one from the variable", async (cb) => {
            const returnValue = await intMinusMinus(10);

            expect(returnValue.value).toBe(9);
            expect(returnValue.result).toBe(10);
            cb();
        });

        it("returns the number value and subtracts 1.0 from the variable", async (cb) => {
            const returnValue = await numberMinusMinux(10.5);

            expect(returnValue.value).toBe(9.5);
            expect(returnValue.result).toBe(10.5);

            cb();
        });
    });

    describe("++x", () => {
        it("returns the value of the variable and adds one to the int variable", async (cb) => {
            const returnValue = await intPlusPlus(10);

            expect(returnValue.value).toBe(11);
            expect(returnValue.result).toBe(10);
            cb();
        });

        it("returns the value of the variable and adds 1.0 to the number variable", async (cb) => {
            const returnValue = await numberPlusPlus(10.5);

            expect(returnValue.value).toBe(11.5);
            expect(returnValue.result).toBe(10.5);

            cb();
        });
    });
});

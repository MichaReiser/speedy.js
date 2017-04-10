async function boolCondition(condition: boolean, trueValue: int, falseValue: int) {
    "use speedyjs";

    return condition ? trueValue : falseValue;
}

async function intCondition(condition: int, trueValue: int, falseValue: int) {
    "use speedyjs";

    return condition ? trueValue : falseValue;
}

async function numberCondition(condition: number, trueValue: int, falseValue: int) {
    "use speedyjs";

    return condition ? trueValue : falseValue;
}

describe("ConditionalExpression", () => {
    describe("boolean condition", () => {
        it("returns the true value if the condition is true", async (cb) => {
            expect(await boolCondition(true, 1, 2)).toBe(1);
            cb();
        });

        it("returns the false value if the condition is false", async (cb) => {
            expect(await boolCondition(false, 1, 2)).toBe(2);
            cb();
        });
    });

    describe("int condition", () => {
        it("returns the true value if the condition is truthy", async (cb) => {
            expect(await intCondition(1, 1, 2)).toBe(1);
            cb();
        });

        it("returns the false value if the condition is falsy", async (cb) => {
            expect(await intCondition(0, 1, 2)).toBe(2);
            cb();
        });
    });

    describe("number condition", () => {
        it("returns the true value if the condition is truthy", async (cb) => {
            expect(await numberCondition(2.3, 1, 2)).toBe(1);
            cb();
        });

        it("returns the false value if the condition is falsy", async (cb) => {
            expect(await numberCondition(0, 1, 2)).toBe(2);
            cb();
        });
    });
});

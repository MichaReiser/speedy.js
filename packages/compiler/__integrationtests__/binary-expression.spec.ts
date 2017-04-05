async function addInts(x: int, y: int) {
    "use speedyjs";

    return x + y;
}

async function addNumbers(x: number, y: number) {
    "use speedyjs";

    return x + y;
}

async function addEqualsInts(x: int, y: int) {
    "use speedyjs";
    x += y;
    return x;
}

async function addEqualsNumbers(x: number, y: number) {
    "use speedyjs";
    x += y;
    return x;
}

async function subtractInts(x: int, y: int) {
    "use speedyjs";

    return x - y;
}

async function subtractNumbers(x: number, y: number) {
    "use speedyjs";

    return x - y;
}

async function subtractEqualsInts(x: int, y: int) {
    "use speedyjs";
    x -= y;
    return x;
}

async function subtractEqualsNumbers(x: number, y: number) {
    "use speedyjs";
    x -= y;
    return x;
}

async function multiplyInts(x: int, y: int) {
    "use speedyjs";

    return x * y;
}

async function multiplyNumbers(x: number, y: number) {
    "use speedyjs";

    return x * y;
}

async function multiplyEqualsInts(x: int, y: int) {
    "use speedyjs";
    x *= y;
    return x;
}

async function multiplyEqualsNumbers(x: number, y: number) {
    "use speedyjs";
    x *= y;
    return x;
}

async function divideInts(x: int, y: int) {
    "use speedyjs";

    return x / y;
}

async function divideNumbers(x: number, y: number) {
    "use speedyjs";

    return x / y;
}

async function divideEqualsInts(x: int, y: int) {
    "use speedyjs";
    x /= y;
    return x;
}

async function divideEqualsNumbers(x: number, y: number) {
    "use speedyjs";
    x /= y;
    return x;
}

async function powInts(base: int, exponent: int) {
    "use speedyjs";
    return base ** exponent;
}

async function powNumbers(base: number, exponent: number) {
    "use speedyjs";
    return base ** exponent;
}

async function powEqualsNumbers(base: number, exponent: number) {
    "use speedyjs";
    base **= exponent;
    return base;
}

async function orInts(x:  int, y: int) {
    "use speedyjs";
    return x | y;
}

async function orNumbers(x:  number, y: number) {
    "use speedyjs";
    return x | y;
}

async function orEqualsInts(x:  int, y: int) {
    "use speedyjs";
    x |= y;
    return x;
}

async function boolsEqual(x: boolean, y: boolean) {
    "use speedyjs";
    return x === y;
}

async function intsEqual(x: int, y: int) {
    "use speedyjs";
    return x === y;
}

async function numbersEqual(x: number, y: number) {
    "use speedyjs";
    return x === y;
}

async function boolsNotEqual(x: boolean, y: boolean) {
    "use speedyjs";
    return x !== y;
}

async function intsNotEqual(x: int, y: int) {
    "use speedyjs";
    return x !== y;
}

async function numbersNotEqual(x: number, y: number) {
    "use speedyjs";
    return x !== y;
}

async function boolGreaterThan(x: boolean, y: boolean) {
    "use speedyjs";
    return x > y;
}

async function intGreaterThan(x: int, y: int) {
    "use speedyjs";
    return x > y;
}

async function numberGreaterThan(x: number, y: number) {
    "use speedyjs";
    return x > y;
}

async function boolGreaterThanEquals(x: boolean, y: boolean) {
    "use speedyjs";
    return x >= y;
}

async function intGreaterThanEquals(x: int, y: int) {
    "use speedyjs";
    return x >= y;
}

async function numberGreaterThanEquals(x: number, y: number) {
    "use speedyjs";
    return x >= y;
}

async function boolLessThan(x: boolean, y: boolean) {
    "use speedyjs";
    return x < y;
}

async function intLessThan(x: int, y: int) {
    "use speedyjs";
    return x < y;
}

async function numberLessThan(x: number, y: number) {
    "use speedyjs";
    return x < y;
}

async function boolLessThanEquals(x: boolean, y: boolean) {
    "use speedyjs";
    return x <= y;
}

async function intLessThanEquals(x: int, y: int) {
    "use speedyjs";
    return x <= y;
}

async function numberLessThanEquals(x: number, y: number) {
    "use speedyjs";
    return x <= y;
}

async function intRemainder(x: int, y: int) {
    "use speedyjs";
    return x % y;
}

async function numberRemainder(x: number, y: number) {
    "use speedyjs";
    return x % y;
}

async function boolAssignment(value: boolean) {
    "use speedyjs";
    let result: boolean;
    result = value;
    return result;
}

async function intAssignment(value: int) {
    "use speedyjs";
    let result: int;
    result = value;
    return result;
}

async function numberAssignment(value: number) {
    "use speedyjs";
    let result: number;
    result = value;
    return result;
}

async function multipleBoolAssignment(value: boolean) {
    "use speedyjs";
    let x: boolean, y: boolean, z: boolean;
    x = y = z = value;
    return y;
}

async function multipleIntAssignment(value: int) {
    "use speedyjs";
    let x: int, y: int, z: int;
    x = y = z = value;
    return x + y + z;
}

async function multipleNumberAssignment(value: number) {
    "use speedyjs";
    let x: number, y: number, z: number;
    x = y = z = value;
    return x + y + z;
}

describe("BinaryExpression", () => {
    describe("+", () => {
       it("adds two ints", async function (cb) {
            const result = await addInts(3, 4);
            expect(result).toBe(3 + 4);
            cb();
       });

        it("adds two numbers", async function (cb) {
            const result = await addNumbers(3.0, 4.0);
            expect(result).toBe(3.0 + 4.0);
            cb();
        });
    });

    describe("+=", () => {
        it("adds x to y and returns the sum of the two integers", async function (cb) {
            expect(await addEqualsInts(3, 4)).toBe(3 + 4);
            cb();
        });

        it("adds x to y and returns the sum of the two numbers", async function (cb) {
            expect(await addEqualsNumbers(3.0, 4.0)).toBe(3.0 + 4.0);
            cb();
        });
    });

    describe("-", () => {
        it("subtracts two ints", async (cb) => {
            const result = await subtractInts(10, 7);
            expect(result).toBe(10 - 7);
            cb();
        });

        it("subtracts two numbers", async (cb) => {
            const result = await subtractNumbers(15.0, 3.5);
            expect(result).toBe(15.0 - 3.5);
            cb();
        });
    });

    describe("-=", () => {
        it("subtracts y from x and returns the difference of the two integers", async function (cb) {
            expect(await subtractEqualsInts(3, 4)).toBe(3 - 4);
            cb();
        });

        it("subtracts y from x and returns the difference of the two numbers", async function (cb) {
            expect(await subtractEqualsNumbers(3.0, 4.0)).toBe(3.0 - 4.0);
            cb();
        });
    });

    describe("*", () => {
        it("multiplies two ints", async (cb) => {
            const result = await multiplyInts(10, 7);
            expect(result).toBe(10 * 7);
            cb();
        });

        it("multiplies two numbers", async (cb) => {
            const result = await multiplyNumbers(1.5, 10);
            expect(result).toBe(1.5 * 10);
            cb();
        });
    });

    describe("*=", () => {
        it("multiplies x with y and returns the product of the two integers", async function (cb) {
            expect(await multiplyEqualsInts(3, 4)).toBe(3 * 4);
            cb();
        });

        it("multiplies x with y and returns the product of the two numbers", async function (cb) {
            expect(await multiplyEqualsNumbers(3.0, 4.0)).toBe(3.0 * 4.0);
            cb();
        });
    });

    describe("/", () => {
        it("divides two ints", async (cb) => {
            const result = await divideInts(70, 7);
            expect(result).toBe(70 / 7);
            cb();
        });

        it("divides two numbers", async (cb) => {
            const result = await divideNumbers(70, 15);
            expect(result).toBe(70 / 15);
            cb();
        });
    });

    describe("/=", () => {
        it("divides x by y and returns the quotient of the two integers", async function (cb) {
            expect(await divideEqualsInts(10, 3)).toBe((10 / 3)| 0);
            cb();
        });

        it("divides x by x and returns the quotient of the two numbers", async function (cb) {
            expect(await divideEqualsNumbers(4, 5)).toBe(4 / 5);
            cb();
        });
    });

    describe("**", () => {
        it("computes the power of an int to the base of an int", async (cb) => {
            const result = await powInts(5, 3);
            expect(result).toBe(5 ** 3);
            cb();
        });

        it("computes the power of a number to the base of a number", async (cb) => {
            const result = await powNumbers(5.0, 3.5);
            expect(result).toBe(5.0 ** 3.5);
            cb();
        });
    });

    describe("**=", () => {
        it("computes the number power of the assignee and the assigned value", async function (cb) {
            expect(await powEqualsNumbers(1.3, 3.4)).toBe(1.3 ** 3.4);
            cb();
        });
    });

    describe("|", () => {
        it("performs a binary or on an int", async (cb) => {
            const result = await orInts(10, 16);
            expect(result).toBe(10 | 16);
            cb();
        });

        it("number | 0 converts a number to an int", async (cb) => {
            expect(await orNumbers(3.495, 0)).toBe(3.495 | 0);
            expect(await orNumbers(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER | 0);
            cb();
        });
    });

    describe("|=", () => {
        it("performs a binary or and assigns the result to the variable", async (cb) => {
            expect(await orEqualsInts(10, 16)).toBe(10 | 16);
            cb();
        });

        // TODO not yet supported, requires automatic type coercion
        // it("converts the value of the number variable to an int", async (cb) => {
        //     expect(await orEqualsNumbers(3.495, 0)).toBe(3.495 | 0);
        //     cb();
        // });
    });

    describe("===", () => {
        it("returns true for equal boolean values and false otherwise", async (cb) => {
            expect(await boolsEqual(true, true)).toBe(true === true);
            expect(await boolsEqual(true, false)).toBe(true === false as any);
            cb();
        });

        it("returns true for equal int values and false otherwise", async (cb) => {
            expect(await intsEqual(3, 3)).toBe(3 === 3);
            expect(await intsEqual(4, 5)).toBe(4 === 5 as any);
            cb();
        });

        it("returns true for equal number values and false otherwise", async (cb) => {
            expect(await numbersEqual(3.12, 3.12)).toBe(3.12 === 3.12);
            expect(await numbersEqual(3.99, 3.98)).toBe(3.99 === 3.98 as any);
            cb();
        });
    });

    describe("!==", () => {
        it("returns false for equal boolean values and true otherwise", async (cb) => {
            expect(await boolsNotEqual(true, true)).toBe(true !== true);
            expect(await boolsNotEqual(true, false)).toBe(true !== false as any);
            cb();
        });

        it("returns false for equal int values and true otherwise", async (cb) => {
            expect(await intsNotEqual(3, 3)).toBe(3 !== 3);
            expect(await intsNotEqual(4, 5)).toBe(4 !== 5 as any);
            cb();
        });

        it("returns false for equal number values and true otherwise", async (cb) => {
            expect(await numbersNotEqual(3.12, 3.12)).toBe(3.12 !== 3.12);
            expect(await numbersNotEqual(3.99, 3.98)).toBe(3.99 !== 3.98 as any);
            cb();
        });
    });

    describe("x > y", () => {
        it("returns true for true compared to false and false otherwise", async (cb) => {
            expect(await boolGreaterThan(true, false)).toBe(true > false);
            expect(await boolGreaterThan(true, true)).toBe(true > true);
            expect(await boolGreaterThan(false, false)).toBe(false > false);
            expect(await boolGreaterThan(false, true)).toBe(false > true);
            cb();
        });

        it("returns true for ints if x > y and false otherwise", async (cb) => {
            expect(await intGreaterThan(4, 3)).toBe(4 > 3);
            expect(await intGreaterThan(4, 4)).toBe(4 > 4);
            expect(await intGreaterThan(3, 4)).toBe(3 > 4);
            cb();
        });

        it("returns true for numbers if x > y and false otherwise", async (cb) => {
            expect(await numberGreaterThan(4.1, 3)).toBe(4.1 > 3);
            expect(await numberGreaterThan(4.0, 4.0)).toBe(4.0 > 4.0);
            expect(await numberGreaterThan(3.0, 4.0)).toBe(3.0 > 4.0);
            cb();
        });
    });

    describe("x >= y", () => {
        it("returns true for true >= true, true >= false and false >= false", async (cb) => {
            expect(await boolGreaterThanEquals(true, false)).toBe(true >= false);
            expect(await boolGreaterThanEquals(true, true)).toBe(true >= true);
            expect(await boolGreaterThanEquals(false, false)).toBe(false >= false);
            expect(await boolGreaterThanEquals(false, true)).toBe(false >= true);
            cb();
        });

        it("returns true for ints unless x is less than y", async (cb) => {
            expect(await intGreaterThanEquals(4, 3)).toBe(4 >= 3);
            expect(await intGreaterThanEquals(4, 4)).toBe(4 >= 4);
            expect(await intGreaterThanEquals(3, 4)).toBe(3 >= 4);
            cb();
        });

        it("returns true for numbers unless x is less than y", async (cb) => {
            expect(await numberGreaterThanEquals(4.1, 3)).toBe(4.1 >= 3);
            expect(await numberGreaterThanEquals(4.0, 4.0)).toBe(4.0 >= 4.0);
            expect(await numberGreaterThanEquals(3.9, 4.0)).toBe(3.9 >= 4.0);
            cb();
        });
    });

    describe("x < y", () => {
        it("returns true for false compared to false and false otherwise", async (cb) => {
            expect(await boolLessThan(true, false)).toBe(true < false);
            expect(await boolLessThan(true, true)).toBe(true < true);
            expect(await boolLessThan(false, false)).toBe(false < false);
            expect(await boolLessThan(false, true)).toBe(false < true);
            cb();
        });

        it("returns true if x is less than y", async (cb) => {
            expect(await intLessThan(3, 4)).toBe(3 < 4);
            expect(await intLessThan(4, 4)).toBe(4 < 4);
            expect(await intLessThan(4, 3)).toBe(4 < 3);
            cb();
        });

        it("returns true if x is less than y", async (cb) => {
            expect(await numberLessThan(3.0, 4.0)).toBe(3.0 < 4.0);
            expect(await numberLessThan(4.0, 4.0)).toBe(4.0 < 4.0);
            expect(await numberLessThan(4.1, 3)).toBe(4.1 < 3);
            cb();
        });
    });

    describe("x <= y", () => {
        it("returns false for true <= false", async (cb) => {
            expect(await boolLessThanEquals(true, false)).toBe(true <= false);
            expect(await boolLessThanEquals(true, true)).toBe(true <= true);
            expect(await boolLessThanEquals(false, false)).toBe(false <= false);
            expect(await boolLessThanEquals(false, true)).toBe(false <= true);
            cb();
        });

        it("returns true for ints unless x is less than y", async (cb) => {
            expect(await intLessThanEquals(3, 4)).toBe(3 <= 4);
            expect(await intLessThanEquals(4, 4)).toBe(4 <= 4);
            expect(await intLessThanEquals(4, 3)).toBe(4 <= 3);
            cb();
        });

        it("returns true for numbers unless x is less than y", async (cb) => {
            expect(await numberLessThanEquals(3, 4.1)).toBe(3 <= 4.1);
            expect(await numberLessThanEquals(4.0, 4.0)).toBe(4.0 <= 4.0);
            expect(await numberLessThanEquals(4, 3.9)).toBe(4 <= 3.9);
            cb();
        });
    });

    describe("x % y", () => {
        it("returns the int remainder", async (cb) => {
            expect(await intRemainder(5, 3)).toBe(5 % 3);
            expect(await intRemainder(5, -3)).toBe(5 % -3);
            expect(await intRemainder(-5, 3)).toBe(-5 % 3);
            expect(await intRemainder(-5, -3)).toBe(-5 % -3);
            cb();
        });

        it("returns the floating point remainder", async (cb) => {
            expect(await numberRemainder(5, 1.4)).toBe(5 % 1.4);
            expect(await numberRemainder(5, -1.4)).toBe(5 % -1.4);
            expect(await numberRemainder(-5, 1.4)).toBe(-5 % 1.4);
            expect(await numberRemainder(-5, -1.4)).toBe(-5 % -1.4);
            cb();
        });
    });

    describe("single assignment", () => {
        it("assigns the value to the variable", async (cb) => {
            expect(await boolAssignment(true)).toBe(true);
            expect(await boolAssignment(false)).toBe(false);
            cb();
        });

        it("assigns the value to the variable", async (cb) => {
            expect(await intAssignment(4)).toBe(4);
            cb();
        });

        it("assigns the value to the variable", async (cb) => {
            expect(await numberAssignment(.3)).toBe(.3);
            cb();
        });
    });

    describe("multiple assignments", () => {
        it("assigns the value to all boolean variables", async (cb) => {
            expect(await multipleBoolAssignment(true)).toBe(true);
            cb();
        });

        it("assigns the value to all int variables", async (cb) => {
            expect(await multipleIntAssignment(10)).toBe(10 + 10 + 10);
            cb();
        });

        it("assigns the value to all number variables", async (cb) => {
            expect(await multipleNumberAssignment(3.3)).toBe(3.3 + 3.3 + 3.3);
            cb();
        });
    });
});

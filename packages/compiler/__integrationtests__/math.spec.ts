async function pi() {
    "use speedyjs";

    return Math.PI;
}

async function sqrtInt(value: int) {
    "use speedyjs";

    return Math.sqrt(value);
}

async function sqrtNumber(value: number) {
    "use speedyjs";

    return Math.sqrt(value);
}

async function powInt(base: int, exp: int) {
    "use speedyjs";

    return Math.pow(base, exp);
}

async function powNumber(base: number, exp: number) {
    "use speedyjs";

    return Math.pow(base, exp);
}

async function logInt(value: int) {
    "use speedyjs";

    return Math.log(value);
}

async function logNumber(value: number) {
    "use speedyjs";

    return Math.log(value);
}

async function sinInt(value: int) {
    "use speedyjs";

    return Math.sin(value);
}

async function sinNumber(value: number) {
    "use speedyjs";

    return Math.sin(value);
}

async function cosInt(value: int) {
    "use speedyjs";

    return Math.cos(value);
}

async function cosNumber(value: number) {
    "use speedyjs";

    return Math.cos(value);
}

describe("Math", () => {
    describe("PI", () => {
        it("returns the value PI", async (cb) => {
            expect(await pi()).toBe(Math.PI);
            cb();
        });
    });

    describe("sqrt", () => {
        it("computes the square root of an int", async (cb) => {
            expect(await sqrtInt(16)).toBe(4);
            cb();
        });

        it("computes the square root of a number", async (cb) => {
            expect(await sqrtNumber(23.33)).toBe(Math.sqrt(23.33));
            cb();
        });
    });

    describe("pow", () => {
        it("computes the square power of an int base and exponent", async (cb) => {
            expect(await powInt(2, 4)).toBe(16);
            cb();
        });

        it("computes the power of a number base and exponent", async (cb) => {
            expect(await powNumber(2.34, 34.2)).toBe(Math.pow(2.34, 34.2));
            cb();
        });
    });

    describe("log", () => {
        it("computes the log of an int", async (cb) => {
            expect(await logInt(100)).toBe(Math.log(100));
            cb();
        });

        it("computes the log of a number", async (cb) => {
            expect(await logNumber(23.33)).toBe(Math.log(23.33));
            cb();
        });
    });

    describe("sin", () => {
        it("computes the sin of an int", async (cb) => {
            expect(await sinInt(100)).toBe(Math.sin(100));
            cb();
        });

        it("computes the sin of a number", async (cb) => {
            expect(await sinNumber(23.33)).toBe(Math.sin(23.33));
            cb();
        });
    });

    describe("cos", () => {
        it("computes the cos of an int", async (cb) => {
            expect(await cosInt(100)).toBeCloseTo(Math.cos(100), 10);
            cb();
        });

        it("computes the cos of a number", async (cb) => {
            expect(await cosNumber(23.33)).toBe(Math.cos(23.33));
            cb();
        });
    });
});

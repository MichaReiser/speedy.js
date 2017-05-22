async function simpleFor() {
    "use speedyjs";

    let x = 0;

    for(let i = 0; i < 10; ++i) {
        x = i;
    }
    return x;
}

async function forContinue() {
    "use speedyjs";

    let result = 1;
    for (let i = 1; i < 10; ++i) {
        if (i % 2 === 1) {
            continue;
        }
        result *= i;
    }

    return result;
}

async function forContinueToLabel() {
    "use speedyjs";

    let result = 0;

    myLabel: for (let i=0; i < 4; ++i) {
        for (let j = 8; j > 4; --j) {
            if (j % i === 0) {
                continue myLabel;
            }
            result += j;
        }
    }

    return result;
}

async function forBreak() {
    "use speedyjs";

    let result = 1;
    for (let i = 1; i < 1000; ++i) {
        if (result > 8000) {
            break;
        }

        result *= i;
    }

    return result;
}

async function forBreakToLabel() {
    "use speedyjs";

    let result = 0;
    loop1:
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
                if (i === 1 && j === 1) {
                    break loop1;
                }

                result += j;
            }
        }

    return result;
}

describe("ForStatement", () => {
    it("loops till the condition is false", async (cb) => {
        expect(await simpleFor()).toBe(9);
        cb();
    });

    describe("continue", () => {
        it("skips the succeeding for statements after a continue statement", async (cb) => {
            expect(await forContinue()).toBe(384);
            cb();
        });

        it("continues with the loop increment of the for statement with the label defined in the continue statement", async (cb) => {
            expect(await forContinueToLabel()).toBe(41);
            cb();
        });
    });

    describe("break", () => {
        it("breaks out of the for loop", async (cb) => {
            expect(await forBreak()).toBe(40320);
            cb();
        });

        it("breaks of the for loop with the label defined by the break statement", async (cb) => {
            expect(await forBreakToLabel()).toBe(3);
            cb();
        });
    });
});

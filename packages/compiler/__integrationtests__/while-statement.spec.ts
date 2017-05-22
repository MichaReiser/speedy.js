async function simpleWhile(end: int) {
    "use speedyjs";

    let i = 0;
    while (i < end) {
        ++i;
    }

    return i;
}

async function whileWithReturn() {
    "use speedyjs";
    let i = 0;

    while (true) {
        if (++i >= 100) {
            return i;
        }
    }
}

async function whileWithContinue() {
    "use speedyjs";

    let i = 0;
    let result = 0;

    while (i < 10) {
        ++i;

        if (i % 2 === 0) {
            continue;
        }

        result += i;
    }

    return result;
}

async function whileWithLabeledContinue() {
    "use speedyjs";

    let result = 0;
    let i = 0;
    let j = 8;

    checkiandj: while (i < 4) {
        i += 1;

        while (j > 4) {
            j -= 1;

            if (j % 2 === 0) {
                continue checkiandj;
            }
            result += j;
        }
    }

    return result;
}

async function whileBreak() {
    "use speedyjs";

    let i = 0;

    while (i < 6) {
        if (i === 3) {
            break;
        }
        i += 1;
    }
    return i;
}

async function whileBreakLabeled() {
    "use speedyjs";

    let i = 0;
    let j = 8;

    outer: while (i < 4) {
        i += 1;

        while (j > 4) {
            j -= 1;

            if (j % 2 === 0) {
                break outer;
            }
        }
    }

    return i;
}

describe("WhileStatement", () => {
    it("loops till the condition is false", async (cb) => {
        expect(await simpleWhile(100)).toBe(100);
        cb();
    });

    it("does not enter the loop if the condition is false", async (cb) => {
        expect(await simpleWhile(0)).toBe(0);
        cb();
    });

    it("does enter the loop if the condition is true", async (cb) => {
        expect(await simpleWhile(1)).toBe(1);
        cb();
    });

    it("does return the value from inside the loop", async (cb) => {
        expect(await whileWithReturn()).toBe(100);
        cb();
    });

    describe("continue", () => {
        it("continues with the loop condition for continue statements", async (cb) => {
            expect(await whileWithContinue()).toBe(25);
            cb();
        });

        it("continues with the labeled loop for labeled continue statements", async (cb) => {
            expect(await whileWithLabeledContinue()).toBe(12);
            cb();
        });
    });

    describe("break", () => {
        it("breaks out of the loop for a break statement", async (cb) => {
            expect(await whileBreak()).toBe(3);
            cb();
        });

        it("breaks out of the labeled loop for a break with a label", async (cb) => {
            expect(await whileBreakLabeled()).toBe(1);
            cb();
        });
    });
});

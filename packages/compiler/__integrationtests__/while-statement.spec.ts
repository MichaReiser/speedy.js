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
});

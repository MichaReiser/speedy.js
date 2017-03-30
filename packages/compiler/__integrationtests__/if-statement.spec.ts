async function simpleIf(condition: boolean, trueValue: number, falseValue: number) {
    "use speedyjs";
    if (condition) {
        return trueValue;
    }

    return falseValue;
}

async function ifElseIfElse(condition: boolean, ifValue: number, elseIfCondition: boolean, elseIfValue: number, elseValue: number) {
    "use speedyjs";

    if (condition) {
        return ifValue;
    } else if (elseIfCondition) {
        return elseIfValue;
    } else {
        return elseValue;
    }
}

async function ifWithIntCondition(condition: int, trueValue: number, falseValue: number) {
    "use speedyjs";

    if (condition) {
        return trueValue;
    } else {
        return falseValue;
    }
}

async function ifWithNumberCondition(condition: number, trueValue: number, falseValue: number) {
    "use speedyjs";

    if (condition) {
        return trueValue;
    } else {
        return falseValue;
    }
}

describe("IfStatement", () => {
    it("takes the if branch if the condition is true", async (cb) => {
        expect(await simpleIf(true, 10, 20)).toBe(10);
        cb();
    });

    it("does not take the if branch if the condition is false", async (cb) => {
        expect(await simpleIf(false, 10, 20)).toBe(20);
        cb();
    });

    it("takes the else if branch if the if condition is false but the else if condition is true", async (cb) => {
        expect(await ifElseIfElse(false, 10, true, 20, 30)).toBe(20);
        cb();
    });

    it("takes the else branch if neither the if nor the else if condition is true", async (cb) => {
        expect(await ifElseIfElse(false, 10, false, 20, 30)).toBe(30);
        cb();
    });

    it("takes the if branch if the int condition value is not equal to zero", async (cb) => {
        expect(await ifWithIntCondition(1, 10, 20)).toBe(10);
        expect(await ifWithIntCondition(100, 10, 20)).toBe(10);
        expect(await ifWithIntCondition(-1, 10, 20)).toBe(10);
        cb();
    });

    it("takes the else branch if the int condition value is equal to zero", async (cb) => {
        expect(await ifWithIntCondition(0, 10, 20)).toBe(20);
        cb();
    });

    it("takes the if branch if the number condition value is not equal to zero", async (cb) => {
        expect(await ifWithNumberCondition(1, 10, 20)).toBe(10);
        expect(await ifWithNumberCondition(0.01, 10, 20)).toBe(10);
        expect(await ifWithNumberCondition(-1, 10, 20)).toBe(10);
        cb();
    });

    it("takes the else branch if the number condition value is equal to zero", async (cb) => {
        expect(await ifWithNumberCondition(0, 10, 20)).toBe(20);
        cb();
    });
});

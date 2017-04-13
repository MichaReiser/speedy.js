class TestClass {
    test: boolean;
    value: int;
}

export async function ifWithNestedAndOrCondition(x: TestClass, y: TestClass) {
    "use speedyjs";

    if ((x || y).test && (x.value > 100 || x.value < 10)) {
        // perform some specific computation
        return 42;
    }

    return 10;
}

class Test {}

async function objectConditionalExpression(condition: Test) {
    "use speedyjs";

    const x = new Test();
    const y = new Test();

    condition ? x : y;
}

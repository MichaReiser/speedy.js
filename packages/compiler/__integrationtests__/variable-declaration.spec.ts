async function initializedVariable() {
    "use speedyjs";

    const x = 10;
    return x;
}

describe("VariableDeclaration", () => {
    it("initializes the value with the specified initializer", async (cb) => {
        expect(await initializedVariable()).toBe(10);
        cb();
    });
});

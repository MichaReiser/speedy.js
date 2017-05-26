async function breakToLabelWithReturnInNormalEnd() {
    "use speedyjs";

    let i = 0;
    // tslint:disable-next-line
    outer_block: {
        {
            ++i;
            if (i === 1) {
                break outer_block;      // breaks out of both inner_block and outer_block
            }
        }

        return 10; // should not generate a branch to outer_block.end
    }

    return i; // always 1
}

describe("LabeledStatement", () => {
    describe("break", () => {
        it("breaks out of the labeled block", async (cb) => {
            expect(await breakToLabelWithReturnInNormalEnd()).toBe(1);
            cb();
        });
    });
});

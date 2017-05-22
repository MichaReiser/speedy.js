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
}

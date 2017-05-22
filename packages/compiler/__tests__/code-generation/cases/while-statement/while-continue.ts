async function whileContinue() {
    "use speedyjs";

    let i = 0;
    let n = 0;

    while (i < 5) {
        ++i;

        if (i === 3) {
            continue;
        }

        n += i;
    }
}

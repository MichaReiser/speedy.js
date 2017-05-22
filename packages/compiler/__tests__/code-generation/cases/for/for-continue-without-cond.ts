async function forContinueWithoutCond() {
    "use speedyjs";

    let result = 0;
    for (let i = 0;; ++i) {
        if (i % 2 === 1) {
            continue;
        }
        result *= i;
    }
}

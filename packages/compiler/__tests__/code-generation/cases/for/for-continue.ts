async function forContinue() {
    "use speedyjs";

    let result = 0;
    for (let i = 0; i < 1000; ++i) {
        if (i % 2 === 1) {
            continue;
        }
        result *= i;
    }

    return result;
}

async function forBreak() {
    "use speedyjs";

    let result = 0;
    for (let i = 0; i < 1000; ++i) {
        if (result > 8000) {
            break;
        }

        result *= i;
    }

    return result;
}

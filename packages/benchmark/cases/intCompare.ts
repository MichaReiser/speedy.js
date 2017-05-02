export async function intCompare(value: int) {
    "use speedyjs";

    return intCompareSync(value);
}

function intCompareSync(value: int) {
    "use speedyjs";

    let sum = 0;
    for (let i = 0; i < 10000000; ++i) {
        if (i < value) {
            sum += 1;
        }
    }

    return sum;
}

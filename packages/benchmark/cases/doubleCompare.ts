export async function doubleCompare() {
    "use speedyjs";

    return doubleCompareSync();
}

function doubleCompareSync() {
    "use speedyjs";

    let sum = 1.0;
    for (let i = 0.001; i < 100.0; i+= 0.001) {
        sum += i;
    }

    return sum;
}

export async function powInt() {
    "use speedyjs";

    return powIntSync();
}

function powIntSync() {
    "use speedyjs";

    let sum = 0.0;
    for (let i = 0; i < 100; ++i) {
        sum += Math.pow(i, 2);
    }

    return sum;
}

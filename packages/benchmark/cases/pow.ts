export async function pow() {
    "use speedyjs";

    return powSync();
}

function powSync() {
    "use speedyjs";

    let sum = 0.0;
    for (let i = 0.5; i < 100.0; ++i) {
        sum += Math.pow(i, 2);
    }

    return sum;
}

export async function doubleAdd() {
    "use speedyjs";

    let sum = 0.0;
    for (let i = 0; i < 100001; ++i) {
        sum += 0.00001;
    }

    return sum;
}

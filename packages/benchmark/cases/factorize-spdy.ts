export async function factorize(num: int) {
    "use speedyjs";

    for (let k = 2; k * k <= num; k++) {
        if (num % k === 0) {
            return k;
        }
    }

    return num;
}

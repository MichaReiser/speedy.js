export async function nsieve(s: int) {
    "use speedyjs";

    const isPrime = new Array<boolean>(s);
    isPrime.fill(true);

    let count = 0;

    for (let i = 2; i < isPrime.length; ++i) {
        if (isPrime[i]) {
            ++count;

            for (let k = i; k < isPrime.length; k += i) {
                isPrime[k] = false;
            }
        }
    }

    return count;
}

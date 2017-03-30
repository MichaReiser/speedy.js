export async function nsieve(size: int): Promise<int> {
    "use speedyjs";

    const isPrime = new Array<boolean>(size);
    isPrime.fill(true);

    let count = 0;

    for (let i = 2; i < isPrime.length; ++i) {
        if (isPrime[i]) {
            ++count;

            for (let k = i; k < isPrime.length; k+=i) {
                isPrime[k] = false;
            }
        }
    }

    return count;
}

export function isPrime(value: int): boolean {
    "use speedyjs";
    if (value <= 1) {
        return false
    }

    for (let i = 2; i <= Math.sqrt(value); ++i) {
        if (value % i === 0) {
            return false;
        }
    }
    return true;
}


export function fib(value: int): int {
    "use speedyjs"

    if (value <= 1) {
        return 1;
    }

    return fib(value - 2) + fib(value - 1);
}

export function nsieve(size: int): int {
    "use speedyjs"

    const isPrime = new Array<boolean>(size);
    for (let i = 0; i < isPrime.length; ++i) {
        isPrime[i] = true;
    }

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

export function isPrime(value: number): boolean {
    "use speedyjs";
    if (value <= 1) {
        return false
    }

    for (let i = 2; i < value / 2; ++i) {
        if (value % i === 0) {
            return false;
        }
    }
    return true;
}

export function fib(value: number): number {
    "use speedyjs"

    if (value <= 1) {
        return 1;
    }

    return fib(value - 2) + fib(value - 1);
}

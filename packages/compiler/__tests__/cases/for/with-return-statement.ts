function isPrime(x: int) {
    "use speedyjs";

    if (x <= 2) {
        return false;
    }

    for (let i = 2; i < (Math.sqrt(x) | 0); ++i) {
        if (x % i === 0) {
            return false;
        }
    }

    return true;
}

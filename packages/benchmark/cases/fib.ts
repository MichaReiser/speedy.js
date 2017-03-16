export function fib(value: int): int {
    "use speedyjs"

    if (value <= 2) {
        return 1;
    }

    return fib(value - 2) + fib(value - 1);
}

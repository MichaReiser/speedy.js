export function fib(value: int): int {
    if (value <= 2) {
        return 1;
    }

    return fib(value - 2) + fib(value - 1);
}

export async function fib(value: int): Promise<int> {
    "use speedyjs";

    if (value <= 2) {
        return 1;
    }

    return await fib(value - 2) + await fib(value - 1);
}


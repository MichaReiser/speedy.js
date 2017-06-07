async function factorial(n: int): Promise<int> {
    "use speedyjs";

    if (n === 0) {
        return 1;
    } else {
        return n * await factorial(n - 1);
    }

}
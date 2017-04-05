async function whileWithReturnAsLastStatement(arg: int): Promise<int> {
    "use speedyjs";

    while (arg) {
        return 10;
    }

    return 0;
}

async function implicitCastOfWhenFalse(condition: boolean): Promise<number> {
    "use speedyjs";

    return condition ? 2.0 : 1;
}

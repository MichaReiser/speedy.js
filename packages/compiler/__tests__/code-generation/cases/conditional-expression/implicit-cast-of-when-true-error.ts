async function implicitCastOfWhenTrue(condition: boolean) {
    "use speedyjs";

    return (condition ? 1 : 2.0) as number;
}

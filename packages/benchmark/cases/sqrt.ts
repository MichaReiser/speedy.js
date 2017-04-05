export async function sqrt(value: number) {
    "use speedyjs";

    return sqrtSync(value);
}

function sqrtSync(value: number) {
    "use speedyjs";

    return Math.sqrt(value);
}

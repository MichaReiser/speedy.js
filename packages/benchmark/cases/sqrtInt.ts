export async function sqrtInt(value: int) {
    "use speedyjs";

    return sqrtIntSync(value);
}

function sqrtIntSync(value: int) {
    "use speedyjs";

    return Math.sqrt(value);
}

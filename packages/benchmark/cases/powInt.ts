export async function powInt(base: int, exp: int) {
    "use speedyjs";

    return powIntSync(base, exp);
}

function powIntSync(base: int, exp: int) {
    "use speedyjs";

    return Math.pow(base, exp);
}

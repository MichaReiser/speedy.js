export async function pow(base: number, exp: number) {
    "use speedyjs";

    return powSync(base, exp);
}

function powSync(base: number, exp: number) {
    "use speedyjs";

    return Math.pow(base, exp);
}

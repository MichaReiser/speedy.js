export async function sqrt(value: number) {
    "use speedyjs";

    return sqrtSync(value);
}

function sqrtSync(value: number) {
    "use speedyjs";

    let result = 0.0;
    for (let i = 0.5; i < value; ++i) {
        result += Math.sqrt(i);
    }

    return result;
}

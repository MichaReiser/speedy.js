export async function sqrtInt(value: int) {
    "use speedyjs";

    return sqrtIntSync(value);
}

function sqrtIntSync(value: int) {
    "use speedyjs";

    let result = 0.0;
    for (let i = 1; i < value; ++i) {
        result += Math.sqrt(i);
    }

    return result;
}

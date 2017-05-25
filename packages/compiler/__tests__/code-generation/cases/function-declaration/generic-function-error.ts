async function entry() {
    "use speedyjs";
    const numberResult = min(10.0, 12.032);
    const booleanResult = min(true, false);
}

function min<T>(a: T, b: T): T {
    "use speedyjs";

    if (a < b) {
        return a;
    }

    return b;
}

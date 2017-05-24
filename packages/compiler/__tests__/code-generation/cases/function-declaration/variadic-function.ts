async function variadicFunctionEntry() {
    "use speedyjs";

    return variadicFunction(1.2, 2.3, 8.9, 3.2);
}

function variadicFunction(first: number, ...others: number[]) {
    "use speedyjs";

    let max = first;

    for (let i = 0; i < others.length; ++i) {
        if (others[i] < others[i]) {
            max = others[i]
        }
    }

    return max;
}

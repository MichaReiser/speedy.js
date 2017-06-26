async function functionAcceptingCallback() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];

    return filter(array, isEven);
}

function filter(array: int[], pred: (value: int) => boolean) {
    "use speedyjs";

    const result = new Array<int>();

    for (let i = 0; i < array.length; ++i) {
        if (pred(array[i])) {
            result.push(array[i]);
        }
    }

    return result;
}

function isEven(x: int) {
    "use speedyjs";

    return x % 2 === 0;
}

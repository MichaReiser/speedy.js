async function passesArray() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    return arrayLength(array);
}

function arrayLength(array: int[]) {
    "use speedyjs";

    return array.length;
}

async function cmp(x: int, y: int) {
    "use speedyjs";

    let result: int;

    if (x < y) {
        result = -1;
    } else if (x === y) {
        result = 0;
    } else {
        result = 1;
    }

    return result;
}

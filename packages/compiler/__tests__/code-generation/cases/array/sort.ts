async function arraySort() {
    "use speedyjs";

    const array = [1, 2];

    const ascending = array.sort();
    const descending = array.sort(descendingComparator);
}

function descendingComparator(a: int, b: int) {
    "use speedyjs";

    return b - a as number;
}

async function arraySplice() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    array.splice(5, 2);
    array.splice(4);
    array.splice(2, 2, 11, 12, 13, 14);
}

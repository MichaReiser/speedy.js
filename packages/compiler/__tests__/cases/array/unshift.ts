function arrayUnshift(): void {
    "use speedyjs";

    const array = [1, 2];

    array.unshift();
    array.unshift(1);
    const newLength = array.unshift(1, 2, 3);
}

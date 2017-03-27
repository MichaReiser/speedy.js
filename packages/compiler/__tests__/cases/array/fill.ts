function arrayFill(): void {
    "use speedyjs";

    const array = new Array<number>(100);

    array.fill(10.0);
    array.fill(10.0, 5);
    array.fill(10.0, 5, 50);
}

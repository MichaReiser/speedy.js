async function arrayElementAccessWithNumberError() {
    "use speedyjs";

    const array = [1, 2, 3, 4, 5];
    array[2] = array[2.1] * 10;
}

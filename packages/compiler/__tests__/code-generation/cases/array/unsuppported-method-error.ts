async function arrayUnsupportedMethod() {
    "use speedyjs";

    const array = [1.0, 2.0, 3.0, 7.0];
    return array.indexOf(3.0);
}

async function initializedVariableDeclaration() {
    "use speedyjs";

    const fn = add;

    return fn(3, 4);
}

function add(x: number, y: number) {
    "use speedyjs";

    return x + y;
}

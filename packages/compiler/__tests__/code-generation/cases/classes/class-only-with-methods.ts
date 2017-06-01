class ClassOnlyWithMethods {
    add(x: number, y: number) {
        "use speedyjs";

        return x + y;
    }
}

export async function classOnlyWithMethods(x: number, y: number) {
    "use speedyjs";

    // const x = new Test();
    const instance = new ClassOnlyWithMethods();

    return instance.add(x, y);
}

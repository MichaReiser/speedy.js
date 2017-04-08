class ClassOnlyWithAttributes {
    x: number;
    y: number;
}

export async function classOnlyWithAttributes() {
    "use speedyjs";

    // const x = new Test();
    const instance = new ClassOnlyWithAttributes();

    return instance.x + instance.y;
}

class ClassWithAttributeInitializer {
    constructor(public x: number, public y: number) {}
}

export async function classWithConstructor() {
    "use speedyjs";

    const instance = new ClassWithAttributeInitializer(10, 15);
    return instance.x + instance.y;
}

class ClassWithAttributeInitializer {
    x: number = 10.0;
    y: number = 0.0;
}

export async function classWithConstructor() {
    "use speedyjs";

    const instance = new ClassWithAttributeInitializer();
    return instance.x + instance.y;
}

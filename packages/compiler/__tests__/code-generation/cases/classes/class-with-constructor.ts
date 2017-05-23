class ClassWithConstructor {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export async function classWithConstructor() {
    "use speedyjs";

    const instance = new ClassWithConstructor(10.0, 20.0);

    return instance.x + instance.y;
}

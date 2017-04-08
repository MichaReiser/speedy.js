class ClassWithAttributeInitializer {
    private distance: number;
    constructor(public x: number, public y: number) {
        this.distance = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
}

export async function classWithConstructor() {
    "use speedyjs";

    const instance = new ClassWithAttributeInitializer(10, 15);
    return instance.x + instance.y;
}

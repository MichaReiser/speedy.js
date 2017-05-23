class ClassWithAttributeInitializer {
    private distance: number;
    constructor(public x: number, public y: number) {
        this.distance = Math.sqrt(Math.pow(this.x, 2.0) + Math.pow(this.y, 2.0));
    }
}

export async function classWithConstructor() {
    "use speedyjs";

    const instance = new ClassWithAttributeInitializer(10.0, 15.0);
    return instance.x + instance.y;
}

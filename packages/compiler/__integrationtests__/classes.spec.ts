class DefaultInitializeClassWithAttributesOnly {
    x: number;
    y: number;
}

class ClassWithConstructor {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

async function createInstanceOfClassWithoutConstructor(): Promise<void> {
    "use speedyjs";

    new DefaultInitializeClassWithAttributesOnly();
}

async function createInstanceOfClassWithDefaultInitializedFields() {
    "use speedyjs";

    const instance = new DefaultInitializeClassWithAttributesOnly();
    return instance.x + instance.y;
}

async function createInstanceAndAssignValuesToAttributes(x: number, y: number) {
    "use speedyjs";

    const instance = new DefaultInitializeClassWithAttributesOnly();

    instance.x = x;
    instance.y = y;

    return instance.x + instance.y;
}

async function callsInstanceConstructor(x: number, y: number) {
    "use speedyjs";

    const instance = new ClassWithConstructor(x, y);
    return instance.x + instance.y;
}

describe("Classes", () => {
    describe("new", () => {
        it("creates a new instance using the default constructor", async (cb) => {
            expect(async () => await createInstanceOfClassWithoutConstructor()).not.toThrow();
            cb();
        });

        it("the fields are default initialized", async (cb) => {
            expect(await createInstanceOfClassWithDefaultInitializedFields()).toEqual(0);
            cb();
        });

        it("calls the constructor of the instance", async (cb) => {
            expect(await callsInstanceConstructor(10, 20)).toBe(30);
            cb();
        });
    });

    describe("properties", () => {
        it("assigns values to the properties", async (cb) => {
            expect(await createInstanceAndAssignValuesToAttributes(10, 20)).toBe(30);
            cb();
        });
    });
});

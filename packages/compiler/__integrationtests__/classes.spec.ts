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

class ClassWithMethod {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other: ClassWithMethod) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

class ClassWithFieldsDeclaredInConstructor {
    constructor(public x: number, public y: number) {}
}

async function createInstanceOfClassWithoutConstructor() {
    "use speedyjs";

    const instance = new DefaultInitializeClassWithAttributesOnly();
    return instance.x + instance.y;
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

async function callsInstanceMethod(x: number, y: number) {
    const center = new ClassWithMethod(0, 0);
    const other = new ClassWithMethod(x, y);

    return center.distanceTo(other);
}

async function createInstanceOfClassWithFieldsDeclaredInConstructor(x: number, y: number) {
    "use speedyjs";

    const instance = new ClassWithFieldsDeclaredInConstructor(x, y);
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

        it("initializes the field with the argument values for fields declared in the constructor", async (cb) => {
            expect(await createInstanceOfClassWithFieldsDeclaredInConstructor(10, 20)).toBe(30);
            cb();
        });
    });

    describe("methods", () => {
        it("calls the method with the this argument", async (cb) => {
             expect(await callsInstanceMethod(3, 4)).toBe(5);
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

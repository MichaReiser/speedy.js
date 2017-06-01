class DefaultInitializeClassWithAttributesOnly {
    x: number;
    y: number;
}

class ClassWithConstructor {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        "use speedyjs";

        this.x = x;
        this.y = y;
    }
}

class ClassWithMethod {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        "use speedyjs";

        this.x = x;
        this.y = y;
    }

    distanceTo(other: ClassWithMethod) {
        "use speedyjs";

        return Math.sqrt(Math.pow(this.x - other.x, 2.0) + Math.pow(this.y - other.y, 2.0));
    }
}

class SubtypeWithMethod extends ClassWithMethod {}

class ClassWithArrayField {
    constructor(public points: ClassWithMethod[] = []) {
        "use speedyjs";
    }

    totalDistance() {
        "use speedyjs";

        let distance = 0.0;

        for (let i = 0; i < this.points.length - 1; ++i) {
            distance += this.points[i].distanceTo(this.points[i + 1]);
        }

        return distance;
    }
}

class ClassWithFieldsDeclaredInConstructor {
    constructor(public x: number, public y: number) {
        "use speedyjs";
    }
}

class ClassWithFieldsOfDifferentSize {
    value: number;
    updated: boolean;
    otherFlag: boolean;
}

async function createInstanceOfClassWithoutConstructor() {
    "use speedyjs";

    return new DefaultInitializeClassWithAttributesOnly();
}

async function createInstanceOfClassWithDefaultInitializedFields() {
    "use speedyjs";

    return new DefaultInitializeClassWithAttributesOnly();
}

async function createInstanceAndAssignValuesToAttributes(x: number, y: number) {
    "use speedyjs";

    const instance = new DefaultInitializeClassWithAttributesOnly();

    instance.x = x;
    instance.y = y;

    return instance;
}

async function callsInstanceConstructor(x: number, y: number) {
    "use speedyjs";

    return new ClassWithConstructor(x, y);
}

async function createInstanceWithMethod(x: number, y: number) {
    "use speedyjs";
    return new ClassWithMethod(x, y);
}

async function readProperty(object: ClassWithMethod) {
    "use speedyjs";

    return object.x;
}

async function callsInstanceMethod(x: ClassWithMethod, y: ClassWithMethod) {
    "use speedyjs";

    return x.distanceTo(y);
}

async function areReferencesEqual(x: ClassWithMethod, y: ClassWithMethod) {
    "use speedyjs";

    return x === y;
}

async function createInstanceOfClassWithFieldsDeclaredInConstructor(x: number, y: number) {
    "use speedyjs";

    return new ClassWithFieldsDeclaredInConstructor(x, y);
}

async function createObjectArray() {
    "use speedyjs";

    const points = new Array<ClassWithMethod>(8);

    for (let i = 0; i < points.length; ++i) {
        const normalized = (i as number) / (points.length as number);
        points[i] = new ClassWithMethod(Math.cos(normalized), Math.sin(normalized));
    }

    return points;
}

async function createTour() {
    "use speedyjs";

    const points = new Array<ClassWithMethod>(8);

    for (let i = 0; i < points.length; ++i) {
        const normalized = (i as number) / (points.length as number);
        points[i] = new ClassWithMethod(Math.cos(normalized), Math.sin(normalized));
    }

    return new ClassWithArrayField(points);
}

async function computeDistance(points: ClassWithMethod[]) {
    "use speedyjs";

    let distance = 0.0;

    for (let i = 0; i < points.length - 1; ++i) {
        distance += points[i].distanceTo(points[i + 1]);
    }

    return distance;
}

async function totalDistance(tour: ClassWithArrayField) {
    "use speedyjs";

    return tour.totalDistance();
}

async function updateFieldsOfClassWithFieldsOfDifferentSize(instance: ClassWithFieldsOfDifferentSize) {
    "use speedyjs";

    instance.updated = true;
    instance.otherFlag = false;
    instance.value = 42.00;
    return instance;
}

async function updateInstance(instance: ClassWithFieldsOfDifferentSize) {
    "use speedyjs";

    instance.updated = true;
    instance.otherFlag = false;
    instance.value = 42.00;
    return instance.value;
}

describe("Classes", () => {
    describe("new", () => {
        it("creates a new instance using the default constructor", async (cb) => {
            const instance = await createInstanceOfClassWithoutConstructor();
            expect(instance.x).toBe(0);
            expect(instance.y).toBe(0);
            cb();
        });

        it("the fields are default initialized", async (cb) => {
            const instance = await createInstanceOfClassWithDefaultInitializedFields();

            expect(instance.x).toBe(0);
            expect(instance.y).toBe(0);
            cb();
        });

        it("calls the constructor of the instance", async (cb) => {
            const instance = await callsInstanceConstructor(10, 20);
            expect(instance.x).toBe(10);
            expect(instance.y).toBe(20);
            cb();
        });

        it("initializes the field with the argument values for fields declared in the constructor", async (cb) => {
            const instance = await createInstanceOfClassWithFieldsDeclaredInConstructor(10, 20);
            expect(instance.x).toBe(10);
            expect(instance.y).toBe(20);
            cb();
        });
    });

    describe("return object", () => {
        it("is a JS objects that is an instance of the corresponding class", async (cb) => {
            const instance = await callsInstanceConstructor(10, 20);
            expect(instance).toEqual(jasmine.any(ClassWithConstructor));
            cb();
        });

        it("sets the prototype correctly so that functions of the object can be invoked", async (cb) => {
            const instance = await createInstanceWithMethod(10, 20);
            expect(instance.distanceTo(new ClassWithMethod(0, 0))).toBe(22.360679774997898);
            cb();
        });

        it("is converted to a JS array of objects of the corresponding class", async (cb) => {
            const points = await createObjectArray();
            expect(points.length).toBe(8);
            expect(points[0]).toEqual(jasmine.any(ClassWithMethod));
            expect(points[0].x).toBe(1);
            expect(points[0].y).toBe(0);
            expect(points[1]).toEqual(jasmine.any(ClassWithMethod));
            expect(points[1].x).toBe(Math.cos(1 / 8.0));
            expect(points[1].y).toBe(Math.sin(1 / 8.0));
            cb();
        });

        it("is converted to a JS object together with the array field", async (cb) => {
            const tour = await createTour();

            expect(tour.points.length).toBe(8);
            expect(tour.totalDistance()).toBeCloseTo(0.8744304497933229, 8);

            cb();
        });

        it("respects the alignment of the classes fields", async (cb) => {
            const instance = await updateFieldsOfClassWithFieldsOfDifferentSize(new ClassWithFieldsOfDifferentSize());

            expect(instance.updated).toBe(true);
            expect(instance.otherFlag).toBe(false);
            expect(instance.value).toBe(42);

            cb();
        });

        it("returns the value as copy and does not exist an existing reference", async (cb) => {
            const instance = new ClassWithFieldsOfDifferentSize();
            const returned = await updateFieldsOfClassWithFieldsOfDifferentSize(instance);

            expect(returned).not.toBe(instance);
            expect(returned.updated).toBe(true);
            expect(returned.value).toBe(42);
            cb();
        });
    });

    describe("object arguments", () => {
        it("creates a WASM object for the passed in JS object with all fields initialized", async (cb) => {
            const instance = new ClassWithMethod(10, 20);
            expect(await readProperty(instance)).toBe(instance.x);
            cb();
        });

        it("converts a JS array to an array of WASM objects", async (cb) => {
            const points = new Array<ClassWithMethod>(8);

            for (let i = 0; i < points.length; ++i) {
                const normalized = (i as number) / (points.length as number);
                points[i] = new ClassWithMethod(Math.cos(normalized), Math.sin(normalized));
            }

            expect(await computeDistance(points)).toBeCloseTo(0.8744304497933229, 8);

            cb();
        });

        it("converts the JS object array of the points field to a WASM array", async (cb) => {
            const points = new Array<ClassWithMethod>(8);

            for (let i = 0; i < points.length; ++i) {
                const normalized = (i as number) / (points.length as number);
                points[i] = new ClassWithMethod(Math.cos(normalized), Math.sin(normalized));
            }

            expect(await totalDistance(new ClassWithArrayField(points))).toBeCloseTo(0.8744304497933229, 8);

            cb();
        });

        it("throws if a subtype is passed", async (cb) => {
            const subtype = new SubtypeWithMethod(10, 11);

            try {
                await readProperty(subtype);
                cb.fail("Expected calling a method with a subtype to throw an error");
            } catch (ex) {
                expect(ex).toEqual(jasmine.any(Error));
                expect((ex as Error).message).toContain(`Expected object of type`);
            }

            cb();
        });

        it("maintains reference equality for arguments pointing to the same JS object", async (cb) => {
            const x = new ClassWithMethod(10.0, 11.0);
            expect(await areReferencesEqual(x, x)).toBe(true);
            cb();
        });

        it("arguments are passed by value", async (cb) => {
            const instance = new ClassWithFieldsOfDifferentSize();

            await updateInstance(instance);

            expect(instance.updated).toBe(undefined as any);
            expect(instance.value).toBe(undefined as any);
            cb();
        });
    });

    describe("methods", () => {
        it("calls the method with the this argument", async (cb) => {
            const center = new ClassWithMethod(0, 0);
            const other = new ClassWithMethod(3, 4);

            expect(await callsInstanceMethod(center, other)).toBe(5);
            cb();
        });
    });

    describe("properties", () => {
        it("assigns values to the properties", async (cb) => {
            const instance = await createInstanceAndAssignValuesToAttributes(10, 20);

            expect(instance.x).toBe(10);
            expect(instance.y).toBe(20);
            cb();
        });
    });
});

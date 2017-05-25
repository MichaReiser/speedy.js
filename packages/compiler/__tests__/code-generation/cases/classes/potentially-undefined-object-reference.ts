class PotentiallyUndefinedClass {
    x: number;
    y: number;
}

export async function classOnlyWithAttributes(instance: PotentiallyUndefinedClass | undefined) {
    "use speedyjs";

    if (instance === undefined) {
        instance = new PotentiallyUndefinedClass();
    }

    return instance.x + instance.y;
}

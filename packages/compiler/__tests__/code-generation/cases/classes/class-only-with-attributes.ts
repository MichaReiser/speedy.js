class ClassOnlyWithAttributes {
    x: number;
    y: number;

    distance() {
        return 2;
    }
}

// declare class Test {
//     x: number;
//     y: number;
//
//     distance(): number;
// }

export async function classOnlyWithAttributes() {
    "use speedyjs";

    // const x = new Test();
    const instance = new ClassOnlyWithAttributes();

    return instance.x + instance.y;
}
class MyClass {}

async function firstAssignment() {
    "use speedyjs";

    let booleanVar: boolean;
    let intVar: int;
    let numberVar: number;
    let objectVar: MyClass;
    let objectOrUndefined: MyClass | undefined;

    booleanVar = true;
    intVar = 23;
    numberVar = 23.23;
    objectVar = new MyClass();
    objectOrUndefined = new MyClass();
    objectOrUndefined = undefined;
}

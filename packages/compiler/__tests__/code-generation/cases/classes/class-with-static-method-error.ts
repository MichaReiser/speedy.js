class ClassWithStaticMethod {
    static lastId = 0;
    private constructor(public id: int) {
        "use speedyjs";
    }

    static create() {
        "use speedyjs";

        return new ClassWithStaticMethod(++ClassWithStaticMethod.lastId);
    }
}

async function classWithStaticMethod() {
    "use speedyjs";

    return ClassWithStaticMethod.create();
}

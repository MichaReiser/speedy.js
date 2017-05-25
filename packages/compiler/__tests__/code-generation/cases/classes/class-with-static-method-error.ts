class ClassWithStaticMethod {
    static lastId = 0;
    private constructor(public id: int) {
    }

    static create() {
        return new ClassWithStaticMethod(++ClassWithStaticMethod.lastId);
    }
}

async function classWithStaticMethod() {
    "use speedyjs";

    return ClassWithStaticMethod.create();
}

class Parent {
    value: number;
}

class Child extends Parent {
    age() {
        "use speedyjs";

        return 10;
    }
}

async function getAge() {
    "use speedyjs";

    const child = new Child();

    return child.age();
}

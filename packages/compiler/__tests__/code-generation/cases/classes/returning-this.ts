class TestBuilder {
    _size: number;

    size(value: number) {
        "use speedyjs";

        this._size = value;
        return this;
    }
}

async function createDefaultBuilder() {
    "use speedyjs";

    return new TestBuilder()
        .size(4);
}
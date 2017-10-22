class TestEqualsEquals {}

async function equalsEqualsEqualsTokenImplicitCast() {
    "use speedyjs";

    let four = 4;

    four === 4.0;
    new TestEqualsEquals() === undefined;
    undefined === new TestEqualsEquals();
}

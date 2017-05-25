class TestEquals {}

async function equalsEqualsEqualsTokenImplicitCast() {
    "use speedyjs";

    let four = 4;

    four === 4.0;
    new TestEquals() === undefined;
    undefined === new TestEquals();
}

class TestEqualsEqualsTypeOne {}
class TestEqualsEqualsTypeTwo {}

async function equalsEqualsEqualsTokenNoImplicitCastError() {
    "use speedyjs";

    new TestEqualsEqualsTypeOne() === new TestEqualsEqualsTypeTwo();
}

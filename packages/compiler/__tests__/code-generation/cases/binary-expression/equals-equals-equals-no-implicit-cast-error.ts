class TestEqualsTypeOne {}
class TestEqualsTypeTwo {}

async function equalsEqualsEqualsTokenNoImplicitCastError() {
    "use speedyjs";

    new TestEqualsTypeOne() === new TestEqualsTypeTwo();
}

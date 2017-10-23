class TestEqualsTypeOne {}
class TestEqualsTypeTwo {}

async function equalsEqualsTokenNoImplicitCastError() {
    "use speedyjs";

    new TestEqualsTypeOne() == new TestEqualsTypeTwo();
}

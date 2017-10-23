class TestNotEqualsTypeOne {}
class TestNotEqualsTypeTwo {}

async function exclamationEqualsTokenNoImplicitCastError() {
    "use speedyjs";

    new TestNotEqualsTypeOne() != new TestNotEqualsTypeTwo();
}

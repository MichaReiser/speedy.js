class TestNotEqualsTypeOne {}
class TestNotEqualsTypeTwo {}

async function exclamationEqualsEqualsTokenNoImplicitCastError() {
    "use speedyjs";

    new TestNotEqualsTypeOne() !== new TestNotEqualsTypeTwo();
}

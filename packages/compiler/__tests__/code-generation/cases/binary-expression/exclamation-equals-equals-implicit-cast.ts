class NotEqualsImplicitCast {}

async function exclamationEqualsEqualsTokenImplicitCast() {
    "use speedyjs";

    let four = 4;

    four !== 4.0;

    new NotEqualsImplicitCast() !== undefined;
    undefined !== new NotEqualsImplicitCast();
}

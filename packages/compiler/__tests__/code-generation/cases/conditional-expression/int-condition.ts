export async function intConditionalExpression(condition: int) {
    "use speedyjs";

    condition ? true : false;
    condition ? 1 : 2;
    condition ? 1.0 : 2.0;
}

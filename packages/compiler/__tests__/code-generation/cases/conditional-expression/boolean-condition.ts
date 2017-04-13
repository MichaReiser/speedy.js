export async function booleanConditionalExpression(condition: boolean) {
    "use speedyjs";

    condition ? true : false;
    condition ? 1 : 2;
    condition ? 1.0 : 2.0;
}

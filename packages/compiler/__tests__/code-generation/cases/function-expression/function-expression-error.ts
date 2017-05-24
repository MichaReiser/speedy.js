export async function functionExpressionUnsupported() {
    "use speedyjs";

    const add = function(x: number, y: number) {
        "use speedyjs";
        return x + y;
    };

    return add(10.2, 112.3);
}

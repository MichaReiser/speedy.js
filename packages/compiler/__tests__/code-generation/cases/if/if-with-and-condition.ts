/**
 * And conditions can be simplified. It is not needed to return the last true value. Instead, it is only
 * important to know whatever the whole expression is true or not. Therefore, if an and expression is inside an if statement,
 * directly created branches into the else branch in case any sub expression is false or go to the then branch if all expressions
 * are true (no intermediate branches are needed). This allows llvm to create better optimized code
 * @return {Promise<void>}
 */
export async function ifWithAndCondition(x: int) {
    "use speedyjs";

    if (x > 10 && x < 100) {
        // perform some specific computation
        return 42;
    }

    return 10;
}

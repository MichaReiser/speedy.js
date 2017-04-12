/**
 * Or conditions can be simplified. It is not needed to return the first true value. Instead, it is only
 * important to know whatever any sub expression evaluates to true or not. Therefore, if an and expression inside an if statement is true,
 * a branch can be created directly to the thenBranch and if all are false a branch to the else branch (no intermediate branches are needed).
 * This allows llvm to create better optimized code
 * @return {Promise<void>}
 */
export async function ifWithOrCondition(x: int) {
    "use speedyjs";

    if (x > 10 || x < 100) {
        // perform some specific computation
        return 42;
    }

    return 10;
}

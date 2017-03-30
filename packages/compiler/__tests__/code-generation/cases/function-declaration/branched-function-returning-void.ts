async function branchedFunctionReturningVoid(arg: int) {
    "use speedyjs";

    let count: int;

    if (arg > 10) {
        count = 0;
    } else {
        count = arg;
    }

    ++count;
}

async function entry() {
    "use speedyjs";
    const intPow2 = pow2(10);
    const numberPow2 = pow2(11.2);
}

function pow2(arg: int): int;
function pow2(arg: number): number;

function pow2(arg: number | int) {
    "use speedyjs";

    return arg + arg;
}



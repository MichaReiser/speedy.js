async function entry() {
    "use speedyjs";
    const numberResult = identity(10.0);
    const booleanResult = identity(true);

    return 10;
}

function identity(arg: number): number;
function identity(arg: boolean): boolean;

function identity(arg: number | boolean) {
    "use speedyjs";

    return arg;
}



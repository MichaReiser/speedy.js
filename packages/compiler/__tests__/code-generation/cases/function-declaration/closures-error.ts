async function closures(arg: number) {
    "use speedyjs";

    function pow2() {
        "use speedyjs";
        return arg + arg;
    }

    return pow2();
}

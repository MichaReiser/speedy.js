async function whileBreak() {
    "use speedyjs";

    let i = 0;

    while (i < 6) {
        if (i === 3) {
            break;
        }
        i += 1;
    }
    return i;
}

async function forContinueToLabel() {
    "use speedyjs";

    myLabel: for (let i=0; i < 4; ++i) {
        for (let j = 8; j > 4; --j) {
            if (j % i === 0) {
                continue myLabel;
            }
        }
    }
}

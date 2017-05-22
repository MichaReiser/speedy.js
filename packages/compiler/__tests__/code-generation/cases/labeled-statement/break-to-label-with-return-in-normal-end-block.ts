async function breakToLabel() {
    "use speedyjs";

    let i = 0;
    outer_block:{
        {
            ++i;
            if (i === 1) {
                break outer_block;      // breaks out of both inner_block and outer_block
            }
        }

        ++i;
    }

    return i; // always 1
}

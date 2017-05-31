export function factorize(num: int) {
    for (let k = 2; k * k <= num; k++) {
        if (num % k === 0) {
            return k;
        }
    }

    return num;
}

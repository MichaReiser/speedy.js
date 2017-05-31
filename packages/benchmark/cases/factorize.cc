extern "C" {
    unsigned int factorize(int num) {
        for (int k = 2; k * k <= num; k++) {
            if (num % k == 0) {
                return k;
            }
        }

        return num;
    }
}

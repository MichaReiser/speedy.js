extern "C" {

    int intCompare(int value) {
        int sum = 0;
        for (unsigned i = 0; i < 10000000; ++i) {
            if (i < value) {
                sum += 1;
            }
        }

        return sum;
    }
}

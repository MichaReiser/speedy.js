extern "C" {
    double doubleAdd() {
        double sum = 0.0;
        for (unsigned i = 0; i < 100001; ++i) {
            sum += 0.00001;
        }

        return sum;
    }
}

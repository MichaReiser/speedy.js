extern "C" {

    double doubleCompare() {
        double sum = 1.0;
        for (double i = 0.001; i < 100.0; i+= 0.001) {
            sum += i;
        }

        return sum;
    }

}

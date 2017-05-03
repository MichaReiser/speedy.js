extern "C" {

int fib(int value) {
    if (value <= 2) {
        return 1;
    }

    return fib(value - 2) + fib(value - 1);
}

}

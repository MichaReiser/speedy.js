#include <vector>

extern "C" {

int nsieve(size_t s) {
    std::vector<bool> isPrime(s, true);
    unsigned count = 0;

    for (unsigned i = 2; i < isPrime.size(); ++i) {
        if (isPrime[i]) {
            ++count;

            for (unsigned k = i; k < isPrime.size(); k+=i) {
                isPrime[k] = false;
            }
        }
    }

    return count;
}

}

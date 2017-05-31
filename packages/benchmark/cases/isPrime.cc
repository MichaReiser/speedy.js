#include <cmath>

extern "C" {
    bool isPrime(unsigned value) {
        if (value <= 2) {
            return false;
        }

        for (unsigned i = 2; i <= static_cast<unsigned>(std::sqrt(value)); ++i) {
            if (value % i == 0) {
                return false;
            }
        }
        return true;
    }
}

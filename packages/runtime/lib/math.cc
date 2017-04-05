#include <cmath>
#include <cstdint>
#include "macros.h"

extern "C" {

ALWAYS_INLINE DLL_PUBLIC double Math_sqrtd(double value) {
    return std::sqrt(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_powii(int base, int exp) {
    return std::pow(base, exp);
}

ALWAYS_INLINE DLL_PUBLIC double Math_powdd(double base, double exp) {
    return std::pow(base, exp);
}
}

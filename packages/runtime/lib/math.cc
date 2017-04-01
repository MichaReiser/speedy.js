#include <cmath>
#include <cstdint>
#include "macros.h"

extern "C" {

ALWAYS_INLINE DLL_PUBLIC double Math_sqrtd(double value) {
    return std::sqrt(value);
}
}

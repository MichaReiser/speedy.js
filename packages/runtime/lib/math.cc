#include <cmath>
#include <cstdint>
#include <algorithm>
#include "macros.h"

extern "C" {

ALWAYS_INLINE DLL_PUBLIC bool isNaNd(void* math, double value) {
    return std::isnan(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_PI(void* math) {
    return M_PI;
}

ALWAYS_INLINE DLL_PUBLIC double Math_powdd(void* math, double base, double power) {
    return std::pow(base, power);
}

ALWAYS_INLINE DLL_PUBLIC double Math_sqrtdd(void* math, double value) {
    return std::sqrt(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_cosd(void* math, double value) {
    return std::cos(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_sind(void* math, double value) {
    return std::sin(value);
}

ALWAYS_INLINE DLL_PUBLIC double_t Math_logd(void* math, double value) {
    return std::log(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_maxPd(void* math, double* values, size_t valueCount) {
    double max = -INFINITY;

    for (size_t i = 0; i < valueCount; ++i) {
        max = std::max(values[i], max);
    }

    return max;
}
}

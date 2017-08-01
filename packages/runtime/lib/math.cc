#include <cmath>
#include <cstdint>
#include <algorithm>
#include "macros.h"

extern "C" {

// The math ptr is passed so that Math does not require a different call semantics than other objects (that this is
// not used is an implementation internal that should not be known by the compiler). As all functions are inlined,
// the unneeded load of the math object is removed

ALWAYS_INLINE DLL_PUBLIC bool isNaNd(double value) {
    return std::isnan(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_PI(__attribute__((unused)) void* math) {
    return M_PI;
}

ALWAYS_INLINE DLL_PUBLIC double Math_powdd(__attribute__((unused)) void* math, double base, double power) {
    return std::pow(base, power);
}

ALWAYS_INLINE DLL_PUBLIC double Math_sqrtd(__attribute__((unused)) void* math, double value) {
    return std::sqrt(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_cosd(__attribute__((unused)) void* math, double value) {
    return std::cos(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_sind(__attribute__((unused)) void* math, double value) {
    return std::sin(value);
}

ALWAYS_INLINE DLL_PUBLIC double_t Math_logd(__attribute__((unused)) void* math, double value) {
    return std::log(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_maxPdu(__attribute__((unused)) void* math, double* values, size_t valueCount) {
    double max = -INFINITY;

    for (size_t i = 0; i < valueCount; ++i) {
        max = std::max(values[i], max);
    }

    return max;
}

ALWAYS_INLINE DLL_PUBLIC int32_t Math_maxPiu(__attribute__((unused)) void* math, int32_t* values, size_t valueCount) {
    int32_t max = -2147483648;

    for (size_t i = 0; i < valueCount; ++i) {
        max = std::max(values[i], max);
    }

    return max;
}

ALWAYS_INLINE DLL_PUBLIC double Math_minPdu(__attribute__((unused)) void* math, double* values, size_t valueCount) {
    double min = INFINITY;

    for (size_t i = 0; i < valueCount; ++i) {
        min = std::min(values[i], min);
    }

    return min;
}

ALWAYS_INLINE DLL_PUBLIC int32_t Math_minPiu(__attribute__((unused)) void* math, int32_t* values, size_t valueCount) {
    int32_t min = 2147483647;

    for (size_t i = 0; i < valueCount; ++i) {
        min = std::min(values[i], min);
    }

    return min;
}

ALWAYS_INLINE DLL_PUBLIC double Math_floord(__attribute__((unused)) void* math, double value) {
    return std::floor(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_roundd(__attribute__((unused)) void* math, double value) {
    return std::round(value);
}
}

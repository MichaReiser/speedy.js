#include <cmath>
#include <cstdint>
#include <algorithm>
#include "macros.h"

extern "C" {

ALWAYS_INLINE DLL_PUBLIC bool isNaNd(double value) {
    return std::isnan(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_PI() {
    return M_PI;
}

ALWAYS_INLINE DLL_PUBLIC double Math_cosd(double value) {
    return std::cos(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_sind(double value) {
    return std::sin(value);
}

ALWAYS_INLINE DLL_PUBLIC double_t Math_logd(double value) {
    return std::log(value);
}

ALWAYS_INLINE DLL_PUBLIC double Math_maxPd(double* values, size_t valueCount) {
    double max = -INFINITY;

    for (size_t i = 0; i < valueCount; ++i) {
        max = std::max(values[i], max);
    }

    return max;
}
}

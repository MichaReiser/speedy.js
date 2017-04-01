#include <cmath>
#include <cstdint>
#include "macros.h"

const long long TWO_TO_THE_POWER_OF_32 = 4294967296;
const uint32_t TWO_TO_THE_POWER_OF_31 = 2147483648;

extern "C" {

/**
 * http://www.ecma-international.org/ecma-262/5.1/#sec-9.5
 * @param the value to convert
 * @returns the double as int32_t
 */
DLL_PUBLIC ALWAYS_INLINE int32_t toInt32d(double value) {
#ifdef SAFE
    int64_t posInt = static_cast<int64_t>(std::copysign(std::floor(std::abs(value)), value));
    uint32_t int32bit = static_cast<uint32_t>(posInt - (TWO_TO_THE_POWER_OF_32 * (posInt/TWO_TO_THE_POWER_OF_32)));

    if (int32bit >= TWO_TO_THE_POWER_OF_31) {
        return static_cast<int32_t>(int32bit - TWO_TO_THE_POWER_OF_32);
    }
    return int32bit;
#else
    return static_cast<int32_t>(value);
#endif
}

}
#include <stdint.h>
#include <cstdlib>
#include "macros.h"
#include "array.h"

#ifndef SPEEDYJS_RUNTIME_ARRAY_API_H
#define SPEEDYJS_RUNTIME_ARRAY_API_H

typedef struct {
    void* ptr;
} Math;


#ifdef __cplusplus
extern "C" {
#endif

extern Math math {};
extern Math* mathPtr = &math;

typedef void* CArrayI1;
typedef void* CArrayI32;
typedef void* CArrayF64;
typedef void* CArrayPtr;

DLL_PUBLIC ALWAYS_INLINE CArrayI1 new_array_i1(size_t size, bool* elements);
DLL_PUBLIC ALWAYS_INLINE CArrayI32 new_array_i32(size_t size, int32_t* elements);
DLL_PUBLIC ALWAYS_INLINE CArrayF64 new_array_f64(size_t size, double* elements);
DLL_PUBLIC ALWAYS_INLINE CArrayPtr new_array_ptr(size_t size, void** elements);

DLL_PUBLIC ALWAYS_INLINE bool array_get_i1(CArrayI1 array, size_t index);
DLL_PUBLIC ALWAYS_INLINE int32_t array_get_i32(CArrayI32 array, size_t index);
DLL_PUBLIC ALWAYS_INLINE double array_get_f64(CArrayF64 array, size_t index);
DLL_PUBLIC ALWAYS_INLINE void* array_get_ptr(CArrayPtr array, size_t index);

DLL_PUBLIC ALWAYS_INLINE void array_set_i1(CArrayI1 array, size_t index, bool value);
DLL_PUBLIC ALWAYS_INLINE void array_set_i32(CArrayI32 array, size_t index, int32_t value);
DLL_PUBLIC ALWAYS_INLINE void array_set_f64(CArrayF64 array, size_t index, double value);
DLL_PUBLIC ALWAYS_INLINE void array_set_ptr(CArrayPtr array, size_t index, void* value);

DLL_PUBLIC ALWAYS_INLINE CArrayI1 array_fill_ii_i1(CArrayI1 array, bool value, int32_t start);
DLL_PUBLIC ALWAYS_INLINE CArrayI32 array_fill_ii_i32(CArrayI32 array, int32_t value, int32_t start);
DLL_PUBLIC ALWAYS_INLINE CArrayF64 array_fill_ii_f64(CArrayF64 array, double value, int32_t start);
DLL_PUBLIC ALWAYS_INLINE CArrayPtr array_fill_ii_ptr(CArrayPtr array, void* value, int32_t start);

DLL_PUBLIC ALWAYS_INLINE CArrayI1 array_fill_iii_i1(CArrayI1 array, bool value, int32_t start, int32_t end);
DLL_PUBLIC ALWAYS_INLINE CArrayI32 array_fill_iii_i32(CArrayI32 array, int32_t value, int32_t start, int32_t end);
DLL_PUBLIC ALWAYS_INLINE CArrayF64 array_fill_iii_f64(CArrayF64 array, double value, int32_t start, int32_t end);
DLL_PUBLIC ALWAYS_INLINE CArrayPtr array_fill_iii_ptr(CArrayPtr array, void* value, int32_t start, int32_t end);

DLL_PUBLIC ALWAYS_INLINE size_t array_push_i1(CArrayI1 array, bool* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_push_i32(CArrayI32 array, int32_t* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_push_f64(CArrayF64 array, double* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_push_ptr(CArrayPtr array, void** elements, size_t numElements);

DLL_PUBLIC ALWAYS_INLINE size_t array_unshift_i1(CArrayI1 array, bool* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_unshift_i32(CArrayI32 array, int32_t* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_unshift_f64(CArrayF64 array, double* elements, size_t numElements);
DLL_PUBLIC ALWAYS_INLINE size_t array_unshift_ptr(CArrayPtr array, void** elements, size_t numElements);

DLL_PUBLIC ALWAYS_INLINE bool array_pop_i1(CArrayI1 array);
DLL_PUBLIC ALWAYS_INLINE int32_t array_pop_i32(CArrayI32 array);
DLL_PUBLIC ALWAYS_INLINE double array_pop_f64(CArrayF64 array);
DLL_PUBLIC ALWAYS_INLINE void* array_pop_ptr(CArrayPtr array);

DLL_PUBLIC ALWAYS_INLINE bool array_shift_i1(CArrayI1 array);
DLL_PUBLIC ALWAYS_INLINE int32_t array_shift_i32(CArrayI32 array);
DLL_PUBLIC ALWAYS_INLINE double array_shift_f64(CArrayF64 array);
DLL_PUBLIC ALWAYS_INLINE void* array_shift_ptr(CArrayPtr array);

DLL_PUBLIC ALWAYS_INLINE size_t array_length_i1(CArrayI1);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_i32(CArrayI32);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_f64(CArrayF64);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_ptr(CArrayPtr);

DLL_PUBLIC ALWAYS_INLINE void array_set_length_i1(CArrayI1, size_t newSize);
DLL_PUBLIC ALWAYS_INLINE void array_set_length_i32(CArrayI32, size_t newSize);
DLL_PUBLIC ALWAYS_INLINE void array_set_length_f64(CArrayF64, size_t newSize);
DLL_PUBLIC ALWAYS_INLINE void array_set_length_ptr(CArrayPtr, size_t newSize);

DLL_PUBLIC ALWAYS_INLINE void delete_array_i1(CArrayI1 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_i32(CArrayI32 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_f64(CArrayF64 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_ptr(CArrayPtr array);

#ifdef __cplusplus
}
#endif


#endif //SPEEDYJS_RUNTIME_ARRAY_API_H

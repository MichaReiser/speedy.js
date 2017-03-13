#include <stdint.h>
#include <cstdlib>
#include "macros.h"

#ifndef SPEEDYJS_RUNTIME_ARRAY_API_H
#define SPEEDYJS_RUNTIME_ARRAY_API_H

#ifdef __cplusplus
extern "C" {
#endif

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

DLL_PUBLIC ALWAYS_INLINE size_t array_length_i1(CArrayI1);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_i32(CArrayI32);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_f64(CArrayF64);
DLL_PUBLIC ALWAYS_INLINE size_t array_length_ptr(CArrayPtr);

DLL_PUBLIC ALWAYS_INLINE void delete_array_i1(CArrayI1 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_i32(CArrayI32 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_f64(CArrayF64 array);
DLL_PUBLIC ALWAYS_INLINE void delete_array_ptr(CArrayPtr array);

#ifdef __cplusplus
}
#endif


#endif //SPEEDYJS_RUNTIME_ARRAY_API_H

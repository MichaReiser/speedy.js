#ifndef RUNTIME_LIBRARY_H
#define RUNTIME_LIBRARY_H

#if defined _WIN32 || defined __CYGWIN__
#ifdef BUILDING_DLL
    #ifdef __GNUC__
      #define DLL_PUBLIC __attribute__ ((dllexport))
    #else
      #define DLL_PUBLIC __declspec(dllexport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #else
    #ifdef __GNUC__
      #define DLL_PUBLIC __attribute__ ((dllimport))
    #else
      #define DLL_PUBLIC __declspec(dllimport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #endif
  #define DLL_LOCAL
#else
#if __GNUC__ >= 4
#define DLL_PUBLIC __attribute__ ((visibility ("default")))
#define DLL_LOCAL  __attribute__ ((visibility ("hidden")))
#else
#define DLL_PUBLIC
    #define DLL_LOCAL
#endif
#endif

#include <cstdlib>

#ifdef __cplusplus
extern "C" {
#endif

    typedef void* CArrayI1;
    typedef void* CArrayI32;
    typedef void* CArrayPtr;
    typedef void* CArrayF64;

DLL_PUBLIC CArrayI1 new_array_i1(size_t size);

/**
 * Creates a new array of the given length
 * @param size the length of the array
 * @param elements the elements of the array. Length of the elements has to be equal to the size or absent to not pre initialize the values
 * @return the created array
 */
DLL_PUBLIC CArrayI32 new_array_i32(size_t size, long int* elements);
DLL_PUBLIC CArrayF64 new_array_f64(size_t size);
DLL_PUBLIC CArrayPtr new_array_ptr(size_t size);

DLL_PUBLIC bool array_get_i1(CArrayI1  array, size_t index);
DLL_PUBLIC long int array_get_i32(CArrayI32  array, size_t index);
DLL_PUBLIC double array_get_f64(CArrayF64 array, size_t index);
DLL_PUBLIC void* array_get_ptr(CArrayPtr array, size_t index);

DLL_PUBLIC void array_set_i1(CArrayI1  array, size_t index, bool value);
DLL_PUBLIC void array_set_i32(CArrayI32  array, size_t index, long int value);
DLL_PUBLIC void array_set_f64(CArrayF64 array, size_t index, double value);
DLL_PUBLIC void array_set_ptr(CArrayPtr array, size_t index, void* value);

DLL_PUBLIC long int array_length_i1(CArrayI1);
DLL_PUBLIC long int array_length_i32(CArrayI32);
DLL_PUBLIC long int array_length_f64(CArrayF64);
DLL_PUBLIC long int array_length_ptr(CArrayPtr);

DLL_PUBLIC void delete_array_i1(CArrayI1 array);
DLL_PUBLIC void delete_array_i32(CArrayI32 array);
DLL_PUBLIC void delete_array_f64(CArrayF64 array);
DLL_PUBLIC void delete_array_ptr(CArrayPtr array);


#ifdef __cplusplus
}
#endif

#endif
#include <stdint.h>
#include "macros.h"
#include "array.h"

#ifndef SPEEDYJS_RUNTIME_ARRAY_API_H
#define SPEEDYJS_RUNTIME_ARRAY_API_H

// see RuntimeSystemNameMangler for the naming schema used


#ifdef __cplusplus
extern "C" {
#endif

//---------------------------------------------------------------------------------
// new
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_constructori(int32_t size) {
    return new Array<bool> { size };
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_constructorPbu(bool* const elements, size_t elementsCount) {
    return new Array<bool> { elements, elementsCount};
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_constructori(int32_t size) {
    return new Array<int32_t> { size };
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_constructorPiu(int32_t* const elements, size_t elementsCount) {
    return new Array<int32_t> { elements, elementsCount};
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_constructori(const int32_t size) {
    return new Array<double> { size };
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_constructorPdu(double* const elements, size_t elementsCount) {
    return new Array<double> { elements, elementsCount };
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_constructori(int32_t size) {
    return new Array<void*> { size };
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_constructorPPvu(void** const elements, size_t elementsCount) {
    return new Array<void*> { elements, elementsCount };
}

//---------------------------------------------------------------------------------
// get
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE bool ArrayIb_geti(const Array<bool>& array, int32_t index) {
    return array.get(index);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_geti(const Array<int32_t>& array, int32_t index) {
    return array.get(index);
}

DLL_PUBLIC ALWAYS_INLINE double ArrayId_geti(const Array<double>& array, int32_t index) {
    return array.get(index);
}

DLL_PUBLIC ALWAYS_INLINE void* ArrayIPv_geti(const Array<void*>& array, int32_t index) {
    return array.get(index);
}

//---------------------------------------------------------------------------------
// set
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE void ArrayIb_setib(Array<bool>& array, int32_t index, bool value) {
    array.set(index, value);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayIi_setii(Array<int32_t>& array, int32_t index, int32_t value) {
    array.set(index, value);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayId_setid(Array<double>& array, int32_t index, double value) {
    array.set(index, value);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayIPv_setiPv(Array<void*>& array, int32_t index, void* value) {
    array.set(index, value);
}

//---------------------------------------------------------------------------------
// fill
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_fillb(Array<bool>& array, bool value) {
    array.fill(value);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_fillbi(Array<bool>& array, bool value, int32_t start) {
    array.fill(value, start);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_fillbii(Array<bool>& array, bool value, int32_t start, int32_t end) {
    array.fill(value, start, end);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_filli(Array<int32_t>& array, int32_t value) {
    array.fill(value);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_fillii(Array<int32_t>& array, int32_t value, int32_t start) {
    array.fill(value, start);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_filliii(Array<int32_t>& array, int32_t value, int32_t start, int32_t end) {
    array.fill(value, start, end);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_filld(Array<double>& array, double value) {
    array.fill(value);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_filldi(Array<double>& array, double value, int32_t start) {
    array.fill(value, start);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_filldii(Array<double>& array, double value, int32_t start, int32_t end) {
    array.fill(value, start, end);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_fillPv(Array<void*>& array, void* value) {
    array.fill(value);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_fillPvi(Array<void*>& array, void* value, int32_t start) {
    array.fill(value, start);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_fillPvii(Array<void*>& array, void* value, int32_t start, int32_t end) {
    array.fill(value, start, end);
    return &array;
}

//---------------------------------------------------------------------------------
// push
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIb_pushPbu(Array<bool>& array, bool* elements, size_t numElements) {
    return array.push(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_pushPiu(Array<int32_t>& array, int32_t* elements, size_t numElements) {
    return array.push(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayId_pushPdu(Array<double>& array, double* elements, size_t numElements) {
    return array.push(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIPv_pushPPvu(Array<void*>& array, void** elements, size_t numElements) {
    return array.push(elements, numElements);
}

//---------------------------------------------------------------------------------
// unshift
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIb_unshiftPbu(Array<bool>& array, bool* elements, size_t numElements) {
    return array.unshift(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_unshiftPiu(Array<int32_t>& array, int32_t* elements, size_t numElements) {
    return array.unshift(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayId_unshiftPdu(Array<double>& array, double* elements, size_t numElements)  {
    return array.unshift(elements, numElements);
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIPv_unshiftPPvu(Array<void*>& array, void** elements, size_t numElements) {
    return array.unshift(elements, numElements);
}

//---------------------------------------------------------------------------------
// pop
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE bool ArrayIb_pop(Array<bool>& array) {
    return array.pop();
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_pop(Array<int32_t>& array) {
    return array.pop();
}

DLL_PUBLIC ALWAYS_INLINE double ArrayId_pop(Array<double>& array) {
    return array.pop();
}

DLL_PUBLIC ALWAYS_INLINE void* ArrayIPv_pop(Array<void*>& array) {
    return array.pop();
}

//---------------------------------------------------------------------------------
// shift
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE bool ArrayIb_shift(Array<bool>& array) {
    return array.shift();
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_shift(Array<int32_t>& array) {
    return array.shift();
}

DLL_PUBLIC ALWAYS_INLINE double ArrayId_shift(Array<double>& array) {
    return array.shift();
}

DLL_PUBLIC ALWAYS_INLINE void* ArrayIPv_shift(Array<void*>& array) {
    return array.shift();
}

//---------------------------------------------------------------------------------
// slice
//---------------------------------------------------------------------------------
DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_slice(const Array<bool>& array) {
    return array.slice();
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_slicei(const Array<bool>& array, int32_t start) {
    return array.slice(start);
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_sliceii(const Array<bool>& array, int32_t start, int32_t end) {
    return array.slice(start, end);
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_slice(const Array<int32_t>& array) {
    return array.slice();
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_slicei(const Array<int32_t>& array, int32_t start) {
    return array.slice(start);
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_sliceii(const Array<int32_t>& array, int32_t start, int32_t end) {
    return array.slice(start, end);
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_slice(const Array<double>& array) {
    return array.slice();
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_slicei(const Array<double>& array, int32_t start) {
    return array.slice(start);
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_sliceii(const Array<double>& array, int32_t start, int32_t end) {
    return array.slice(start, end);
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_slice(const Array<void*>& array) {
    return array.slice();
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_slicei(const Array<void*>& array, int32_t start) {
    return array.slice(start);
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_sliceii(const Array<void*>& array, int32_t start, int32_t end) {
    return array.slice(start, end);
}

//---------------------------------------------------------------------------------
// splice
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_splicei(Array<bool>& array, int32_t index) {
    return array.splice(index, array.length());
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_spliceii(Array<bool>& array, int32_t index, int32_t deleteCount) {
    return array.splice(index, deleteCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_spliceiiPbu(Array<bool>& array, int32_t index, int32_t deleteCount, bool* elements, size_t elementsCount) {
    return array.splice(index, deleteCount, elements, elementsCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_splicei(Array<int32_t>& array, int32_t index) {
    return array.splice(index, array.length());
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_spliceii(Array<int32_t>& array, int32_t index, int32_t deleteCount) {
    return array.splice(index, deleteCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_spliceiiPiu(Array<int32_t>& array, int32_t index, int32_t deleteCount, int32_t* elements, size_t elementsCount) {
    return array.splice(index, deleteCount, elements, elementsCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_splicei(Array<double>& array, int32_t index) {
    return array.splice(index, array.length());
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_spliceii(Array<double>& array, int32_t index, int32_t deleteCount) {
    return array.splice(index, deleteCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_spliceiiPdu(Array<double>& array, int32_t index, int32_t deleteCount, double* elements, size_t elementsCount) {
    return array.splice(index, deleteCount, elements, elementsCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_splicei(Array<void*>& array, int32_t index) {
    return array.splice(index, array.length());
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_spliceii(Array<void*>& array, int32_t index, int32_t deleteCount) {
    return array.splice(index, deleteCount);
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_spliceiiPPvu(Array<void*>& array, int32_t index, int32_t deleteCount, void** elements, size_t elementsCount) {
    return array.splice(index, deleteCount, elements, elementsCount);
}

//---------------------------------------------------------------------------------
// length
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIb_length(const Array<bool>& array) {
    return array.length();
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIi_length(const Array<int32_t>& array) {
    return array.length();
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayId_length(const Array<double>& array) {
    return array.length();
}

DLL_PUBLIC ALWAYS_INLINE int32_t ArrayIPv_length(const Array<void*>& array) {
    return array.length();
}

DLL_PUBLIC ALWAYS_INLINE void ArrayIb_lengthi(Array<bool>& array, int32_t size) {
    array.resize(size);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayIi_lengthi(Array<int32_t>& array, int32_t size) {
    array.resize(size);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayId_lengthi(Array<double>& array, int32_t size) {
    array.resize(size);
}

DLL_PUBLIC ALWAYS_INLINE void ArrayIPv_lengthi(Array<void*>& array, int32_t size) {
    array.resize(size);
}

//---------------------------------------------------------------------------------
// length
//---------------------------------------------------------------------------------

DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_sort(Array<bool>& array) {
    array.sort();
    return &array;
}

typedef double (*BoolComparator)(const bool a, const bool b);
DLL_PUBLIC ALWAYS_INLINE Array<bool>* ArrayIb_sortPFdbb(Array<bool>& array, BoolComparator comparator) {
    array.sort(comparator);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_sort(Array<int32_t>& array) {
    array.sort();
    return &array;
}

typedef double (*IntComparator)(const int32_t a, const int32_t b);
DLL_PUBLIC ALWAYS_INLINE Array<int32_t>* ArrayIi_sortPFdii(Array<int32_t>& array, IntComparator comparator) {
    array.sort(comparator);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_sort(Array<double>& array) {
    array.sort();
    return &array;
}

typedef double (*DoubleComparator)(const double a, const double b);
DLL_PUBLIC ALWAYS_INLINE Array<double>* ArrayId_sortPFddd(Array<double>& array, DoubleComparator comparator) {
    array.sort(comparator);
    return &array;
}

DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_sort(Array<void*>& array) {
    array.sort();
    return &array;
}

typedef double (*ObjectComparator)(void* const a, void* const b);
DLL_PUBLIC ALWAYS_INLINE Array<void*>* ArrayIPv_sortPFdPvPv(Array<void*>& array, ObjectComparator comparator) {
    array.sort(comparator);
    return &array;
}

#ifdef __cplusplus
}
#endif


#endif //SPEEDYJS_RUNTIME_ARRAY_API_H

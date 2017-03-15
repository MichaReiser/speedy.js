#include "array-api.h"
#include "array.h"

CArrayI1 new_array_i1(size_t size, bool* elements) {
    return new Array<bool>(size, elements);
}

CArrayI32 new_array_i32(size_t size, int32_t * elements) {
    return new Array<int32_t>(size, elements);
}

CArrayF64 new_array_f64(size_t size, double* elements) {
    return new Array<double>(size, elements);
}

CArrayPtr new_array_ptr(size_t size, void** elements) {
    return new Array<void *>(size, elements);
}

bool array_get_i1(CArrayI1  array, size_t index) {
    return static_cast<Array<bool>*>(array)->get(index);
}

int32_t array_get_i32(CArrayI32  array, size_t index) {
    return static_cast<Array<int32_t>*>(array)->get(index);
}

double array_get_f64(CArrayF64 array, size_t index) {
    return static_cast<Array<double>*>(array)->get(index);
}

void* array_get_ptr(CArrayPtr array, size_t index) {
    return static_cast<Array<void*>*>(array)->get(index);
}

void array_set_i1(CArrayI1  array, size_t index, bool value) {
    static_cast<Array<bool>*>(array)->set(index, value);
}

void array_set_i32(CArrayI32  array, size_t index, int32_t value) {
    static_cast<Array<int32_t>*>(array)->set(index, value);
}

void array_set_f64(CArrayF64 array, size_t index, double value) {
    static_cast<Array<double>*>(array)->set(index, value);
}

void array_set_ptr(CArrayPtr array, size_t index, void* value) {
    static_cast<Array<void*>*>(array)->set(index, value);
}

size_t array_length_i1(CArrayI1 array) {
    return static_cast<Array<bool>*>(array)->length;
}

size_t array_length_i32(CArrayI32 array) {
    return static_cast<Array<int32_t>*>(array)->length;
}

size_t array_length_f64(CArrayF64 array) {
    return static_cast<Array<double>*>(array)->length;
}

size_t array_length_ptr(CArrayPtr array) {
    return static_cast<Array<void*>*>(array)->length;
}

void delete_array_i1(CArrayI1 array) {
    delete static_cast<Array<bool>*>(array);
}

void delete_array_i32(CArrayI32 array) {
    delete static_cast<Array<int32_t>*>(array);
}

void delete_array_f64(CArrayF64 array) {
    delete static_cast<Array<double>*>(array);
}

void delete_array_ptr(CArrayPtr array) {
    delete static_cast<Array<void*>*>(array);
}
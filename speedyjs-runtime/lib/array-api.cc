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

CArrayI1 array_fill_ii_i1(CArrayI1 array, bool value, int32_t start) {
    static_cast<Array<bool>*>(array)->fill(value, start);
    return array;
}

CArrayI32 array_fill_ii_i32(CArrayI32 array, int32_t value, int32_t start) {
    static_cast<Array<int32_t>*>(array)->fill(value, start);
    return array;
}

CArrayF64 array_fill_ii_f64(CArrayF64 array, double value, int32_t start) {
    static_cast<Array<double>*>(array)->fill(value, start);
    return array;
}

CArrayPtr array_fill_ii_ptr(CArrayPtr array, void* value, int32_t start) {
    static_cast<Array<void*>*>(array)->fill(value, start);
    return array;
}

CArrayI1 array_fill_iii_i1(CArrayI1 array, bool value, int32_t start, int32_t end) {
    static_cast<Array<bool>*>(array)->fill(value, start, end);
    return array;
}

CArrayI32 array_fill_iii_i32(CArrayI32 array, int32_t value, int32_t start, int32_t end) {
    static_cast<Array<int32_t>*>(array)->fill(value, start, end);
    return array;
}

CArrayF64 array_fill_iii_f64(CArrayF64 array, double value, int32_t start, int32_t end) {
    static_cast<Array<double>*>(array)->fill(value, start, end);
    return array;
}

CArrayPtr array_fill_iii_ptr(CArrayPtr array, void* value, int32_t start, int32_t end) {
    static_cast<Array<void*>*>(array)->fill(value, start, end);
    return array;
}

size_t array_push_i1(CArrayI1 array, bool* elements, size_t numElements) {
    return static_cast<Array<bool>*>(array)->push(elements, numElements);
}

size_t array_push_i32(CArrayI32 array, int32_t* elements, size_t numElements) {
    return static_cast<Array<int32_t>*>(array)->push(elements, numElements);
}

size_t array_push_f64(CArrayF64 array, double* elements, size_t numElements) {
    return static_cast<Array<double>*>(array)->push(elements, numElements);
}

size_t array_push_ptr(CArrayPtr array, void** elements, size_t numElements) {
    return static_cast<Array<void*>*>(array)->push(elements, numElements);
}

size_t array_unshift_i1(CArrayI1 array, bool* elements, size_t numElements) {
    return static_cast<Array<bool>*>(array)->unshift(elements, numElements);
}

size_t array_unshift_i32(CArrayI32 array, int32_t* elements, size_t numElements) {
    return static_cast<Array<int32_t>*>(array)->unshift(elements, numElements);
}

size_t array_unshift_f64(CArrayF64 array, double* elements, size_t numElements) {
    return static_cast<Array<double>*>(array)->unshift(elements, numElements);
}

size_t array_unshift_ptr(CArrayPtr array, void** elements, size_t numElements) {
    return static_cast<Array<void*>*>(array)->unshift(elements, numElements);
}

bool array_pop_i1(CArrayI1 array) {
    return static_cast<Array<bool>*>(array)->pop();
}

int32_t array_pop_i32(CArrayI32 array) {
    return static_cast<Array<int32_t>*>(array)->pop();
}

double array_pop_f64(CArrayF64 array) {
    return static_cast<Array<double>*>(array)->pop();
}

void* array_pop_ptr(CArrayPtr array) {
    return static_cast<Array<void*>*>(array)->pop();
}

bool array_shift_i1(CArrayI1 array) {
    return static_cast<Array<bool>*>(array)->shift();
}

int32_t array_shift_i32(CArrayI32 array) {
    return static_cast<Array<int32_t>*>(array)->shift();
}

double array_shift_f64(CArrayF64 array) {
    return static_cast<Array<double>*>(array)->shift();
}

void* array_shift_ptr(CArrayPtr array) {
    return static_cast<Array<void*>*>(array)->shift();
}

size_t array_length_i1(CArrayI1 array) {
    return static_cast<Array<bool>*>(array)->size();
}

size_t array_length_i32(CArrayI32 array) {
    return static_cast<Array<int32_t>*>(array)->size();
}

size_t array_length_f64(CArrayF64 array) {
    return static_cast<Array<double>*>(array)->size();
}

size_t array_length_ptr(CArrayPtr array) {
    return static_cast<Array<void*>*>(array)->size();
}

void array_set_length_i1(CArrayI1 array, size_t newSize) {
    static_cast<Array<bool>*>(array)->resize(newSize);
}

void array_set_length_i32(CArrayI32 array, size_t newSize) {
    static_cast<Array<int32_t>*>(array)->resize(newSize);
}

void array_set_length_f64(CArrayF64 array, size_t newSize) {
    static_cast<Array<double>*>(array)->resize(newSize);
}

void array_set_length_ptr(CArrayPtr array, size_t newSize) {
    static_cast<Array<void*>*>(array)->resize(newSize);
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
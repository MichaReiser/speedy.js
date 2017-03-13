#include <vector>
#include "../include/runtime.h"

CArrayI1 new_array_i1(size_t size) {
    return new std::vector<bool> (size);
}

CArrayI32 new_array_i32(size_t size, long int* elements) {
    if (size > 0 && elements) {
        return new std::vector<long int>(elements, elements + size * sizeof(long int));
    }

    return new std::vector<long int>(size, 0);
}

CArrayF64 new_array_f64(size_t size) {
    return new std::vector<double>(size);
}

CArrayPtr new_array_ptr(size_t size) {
    return new std::vector<void*>(size);
}

bool array_get_i1(CArrayI1  array, size_t index) {
    return (static_cast<std::vector<bool>*>(array))->at(index);
}

long int array_get_i32(CArrayI32  array, size_t index) {
    return (static_cast<std::vector<long int>*>(array))->at(index);
}

double array_get_f64(CArrayF64 array, size_t index) {
    return (static_cast<std::vector<double>*>(array))->at(index);
}

void* array_get_ptr(CArrayPtr array, size_t index) {
    return (static_cast<std::vector<void *>*>(array))->at(index);
}

template<typename T>
void array_set(std::vector<T>* vector, size_t index, T value) {
    if (vector->size() <= index) {
        vector->resize(index + 1);
    }

    (*vector)[index] = value;
}

void array_set_i1(CArrayI1  array, size_t index, bool value) {
    array_set(static_cast<std::vector<bool>*>(array), index, value);
}
void array_set_i32(CArrayI32  array, size_t index, long int value) {
    array_set(static_cast<std::vector<long int>*>(array), index, value);
}
void array_set_f64(CArrayF64 array, size_t index, double value) {
    array_set(static_cast<std::vector<double>*>(array), index, value);
}

void array_set_ptr(CArrayPtr array, size_t index, void* value) {
    array_set(static_cast<std::vector<void*>*>(array), index, value);
}

long int array_length_i1(CArrayI1 array) {
    return static_cast<std::vector<bool>*>(array)->size();
}

long int array_length_i32(CArrayI32 array) {
    return (static_cast<std::vector<long int>*>(array))->size();
}

long int array_length_f64(CArrayF64 array) {
    return (static_cast<std::vector<double>*>(array))->size();
}

long int array_length(CArrayPtr array) {
    return static_cast<std::vector<void*>*>(array)->size();
}

void delete_array_i1(CArrayI1 array) {
    delete static_cast<std::vector<bool>*>(array);
}

void delete_array_i32(CArrayI32 array) {
    delete static_cast<std::vector<long int>*>(array);
}

void delete_array_f64(CArrayF64 array) {
    delete static_cast<std::vector<double>*>(array);
}

void delete_array_ptr(CArrayPtr array) {
    delete static_cast<std::vector<void*>*>(array);
}
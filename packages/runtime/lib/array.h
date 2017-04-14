//
// Created by Micha Reiser on 14.03.17.
//

#ifndef SPEEDYJS_RUNTIME_ARRAY_H
#define SPEEDYJS_RUNTIME_ARRAY_H

#include <stdexcept>
#include <stdint.h>
#include <cstdlib>
#include <cstring>
#include <new>
#include <algorithm>
#include "macros.h"

const int32_t CAPACITY_GROW_FACTOR = 2;
const int32_t DEFAULT_CAPACITY = 16;

/**
 * Implementation of the JS Array. Grows when more elements are added.
 * int32_t is used as there is no uint32_t in speedyjs.
 *
 * Differences to vector:
 * This Class does use memset to default initialize the elements and not the allocator.
 * @tparam T type of the elements stored in the array
 */
template<typename T>
class Array {
private:
    /**
     * The elements stored in the array. Has the size of {@link capacity}. All elements up to {@link length} are initialized
     * with zero. Is the nullptr if the length is zero (no allocation is needed in this case)
     */
    T* elements;

    /**
     * The length of the array
     */
    int32_t length;

    /**
     * The capacity of the {@link elements}
     */
    int32_t capacity;

    /**
     * Creates a new array of the given size
     * @param size the size (length) of the new array
     * @param initialize indicator if the elements array is to be default initialized.
     */
    inline Array(int32_t size, bool initialize) {
#ifdef SAFE
        if (size < 0) {
            throw std::out_of_range("Invalid array length");
        }
#endif

        elements = Array<T>::allocateElements(size);

#ifdef SAFE
        if (initialize) {
            // This is quite expensive, if there is a GC that guarantees zeroed memory, this is no longer needed
            std::fill_n(elements, size, T {});
        }
#endif
        capacity = length = size;
    }

public:
    /**
     * Creates a new array of the given size
     * @param size the size (length) of the new array
     * @param initialize indicator if the elements array is to be default initialized.
     */
    inline Array(int32_t size = 0) : Array(size, true) {
    }

    /**
     * Creates a new array containing the passed in elements
     * @param arrayElements the elements to be added to the array
     * @param elementsCount the number of elements
     */
    inline Array(const T* arrayElements, int32_t elementsCount) __attribute__((nonnull(2))):
            Array(elementsCount, false) {
        std::copy(arrayElements, arrayElements + elementsCount, elements);
    }

    inline ~Array() {
        std::free(elements);
    }

    /**
     * Returns the element at the given index
     * @param index the index of the element to return
     * @return the element at the given index or the default value for T if the index is out of bound (only in safe mode)
     */
    inline T get(int32_t index) const {
 #ifdef SAFE
        if (index < 0 || index >= length) {
            return T {};
        }
 #endif

        return elements[index];
    }

    /**
     * Sets the value at the given index position. The array is resized to a length of the index + 1 if index >= length.
     * @param index the index of the element where the value is to be set
     * @param value the value to set at the given index
     */
    inline void set(int32_t index, T value) {
 #ifdef SAFE
        if (index < 0) {
            throw std::out_of_range("Invalid array index");
        }

        if (index >= length) {
            resize(index + 1);
        }
 #endif

        elements[index] = value;
    }

    inline void fill(const T value, int32_t start=0) {
        fill(value, start, length);
    }

    /**
     * Sets the value of the array elements in between start and end to the given constant
     * @param value the value to set
     * @param start the start from which the values should be initialized
     * @param end the end where the value should no longer be set (exclusive)
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
     */
    inline void fill(const T value, int32_t start, int32_t end) {
        int32_t startIndex = start < 0 ? length + start : start;
        int32_t endIndex = end < 0 ? length + end : end;

 #ifdef SAFE
        startIndex = std::min(std::max(startIndex, 0), length);
        endIndex = std::min(std::max(endIndex, startIndex), length);
 #endif

        std::fill(elements + startIndex, elements + endIndex, value);
    }

    /**
     * Adds one or several new elements to the and of the array
     * @param elementsToAdd the elements to add, not a nullptr
     * @param numElements the number of elements to add
     * @return the new length of the array
     */
    inline int32_t push(const T* elementsToAdd, int32_t numElements) __attribute__((nonnull(2))) {
        const int32_t newLength = length + numElements;
        ensureCapacity(newLength);

        std::copy(elementsToAdd, elementsToAdd + numElements, &elements[length]);
        length = newLength;
        return length;
    }

    /**
     * Adds an element to the beginning of the array and returns the new length
     * @param elementsToAdd the elements to add
     * @param numElements the number of elements to add
     * @return the new length after inserting the given element
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
     */
    inline int32_t unshift(const T* elementsToAdd, int32_t numElements) __attribute__((nonnull(2))) {
        const int32_t newLength = length + numElements;
        ensureCapacity(newLength);

        std::copy(elements, elements + length, elements + numElements);
        std::copy(elementsToAdd, elementsToAdd + numElements, elements);

        length = newLength;
        return length;
    }

    /**
     * Removes the last element and returns it
     * @return the last element or the default value of T if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
     */
    inline T pop() {
 #ifdef SAFE
        if (length == 0) {
            return {};
        }
 #endif

        return elements[--length];
    }

    /**
     * Removes the first element and returns it
     * @return the first element or the default value of T if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
     */
    inline T shift() {
#ifdef SAFE
        if (length == 0) {
            return T {};
        }
#endif

        const T element = elements[0];
        std::copy(elements + 1, elements + length, elements);
        --length;
        return element;
    }

    inline Array<T>* slice(int32_t start = 0) const  __attribute__((returns_nonnull)) {
        return slice(start, length);
    }

    /**
     * Returns a copy of the array containing the elements from start to end
     * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
     */
    inline Array<T>* slice(int32_t start, int32_t end) const  __attribute__((returns_nonnull)) {
#ifdef SAFE
        if (start < 0) {
            start = length + start;
        }

        if (end < 0) {
            end = length + end;
        }

        start = std::min(start, length);
        end = std::max(start, std::min(end, length));
#endif
        const int32_t elementsCount = end - start;
        Array<T>* result = new Array<T>(elementsCount, false);
        std::copy(elements + start, elements + end, result->elements);
        return result;
    }

    inline Array<T>* splice(int32_t index, int32_t deleteCount, T* elementsToAdd = nullptr, int32_t elementsCount = 0)  __attribute__((returns_nonnull)) {
#ifdef SAFE
        if (index < 0) {
            index = length + index;
        }

        index = std::min(index, length);
        deleteCount = std::min(std::max(deleteCount, 0), length - index);
#endif

        if (deleteCount < elementsCount) {
            // Make place for the new items
            ensureCapacity(length + elementsCount - deleteCount);
        }

        // safe the deleted elements
        Array<T>* deleted = new Array<T>(deleteCount, false);
        std::move(elements + index, elements + index + deleteCount, deleted->elements);

        // Move the following elements into right place
        std::move(elements + index + deleteCount, elements + length, elements + index + elementsCount);

        // insert the new elements
        std::copy(elementsToAdd, elementsToAdd + elementsCount, elements + index);
        length += elementsCount - deleteCount;

        return deleted;
    }

    /**
     * Returns the size of the array
     * @return the size
     */
    inline int32_t size() const {
        return length;
    }

    /**
     * Resizes the array to the new size.
     * @param newSize the new size
     */
    inline void resize(int32_t newSize) {
#ifdef SAFE
        if (newSize < 0) {
            throw std::out_of_range("Invalid array length");
        }
#endif

        ensureCapacity(newSize);

        // No reduce
#ifdef SAFE
        if (length < newSize) {
            std::fill_n(&elements[length], newSize - length, T {}); // Default initialize values
        }
#endif

        length = newSize;
    }

private:
    /**
     * Ensures that the capacity of the array is at lest of the given size
     * @param min the minimal required capacity
     */
    inline void ensureCapacity(int32_t min) {
        if (min < capacity) {
            return;
        }

        int32_t newCapacity = capacity == 0 ? DEFAULT_CAPACITY : capacity * CAPACITY_GROW_FACTOR;

        if (static_cast<size_t>(newCapacity) > INT32_MAX) {
            newCapacity = INT32_MAX;
        }

        newCapacity = std::max(newCapacity, min);

        elements = Array<T>::allocateElements(newCapacity, elements);
        capacity = newCapacity;
    }

    /**
     * (Re) Allocates an array for the elements with the given capacity
     * @param capacity the capacity to allocate
     * @param elements existing pointer to the elements array, in this case, a reallocate is performed
     * @returns the pointer to the allocated array
     */
    static inline T* allocateElements(int32_t capacity, T* elements = nullptr)  __attribute__((returns_nonnull)) {
        void* allocation = std::realloc(elements, capacity * sizeof(T));

        if (allocation == nullptr) {
            throw std::bad_alloc {};
        }

        return static_cast<T*>(allocation);
    }
};

#endif //SPEEDYJS_RUNTIME_ARRAY_H

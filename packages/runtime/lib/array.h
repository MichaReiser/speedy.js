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
     * The length of the array
     */
    int32_t length;

    /**
     * The capacity of the {@link elements}
     */
    int32_t capacity;

    /**
     * The elements stored in the array. Has the size of {@link capacity}. All elements up to {@link length} are initialized
     * with zero. Is the nullptr if the length is zero (no allocation is needed in this case)
     */
    T* elements;
public:
    /**
     * Creates a new array of the given size
     * @param size the size (length) of the new array
     * @param elements the elements contained in the array with the length equal to size. If absent, the elements are default
     * initialized.
     */
    Array(int32_t size=0, const T* elements = nullptr) {
        if (size == 0) {
            this->elements = nullptr;
        } else {
            this->elements = Array<T>::allocateElements(size);

            if (elements == nullptr) {
#ifdef SAFE
                // This is quite expensive, if there is a GC that guarantees zeroed memory, this is no longer needed
                std::fill_n(this->elements, size, T {});
#endif
            } else {
                std::copy(elements, elements + size, this->elements);
            }
        }

        this->capacity = size;
        this->length = size;
    }

    inline ~Array() {
        std::free(this->elements);
    }

    /**
     * Returns the element at the given index
     * @param index the index of the element to return
     * @return the element at the given index
     * @throws {@link std::out_of_range} if the index is <= length
     */
    inline T get(int32_t index) const {
 #ifdef SAFE
        if (length <= index) {
            throw std::out_of_range{"Index out of bound"};
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
        if (length <= index) {
            this->resize(index + 1);
        }
 #endif

        elements[index] = value;
    }

    inline void fill(const T value, int32_t start=0) {
        this->fill(value, start, this->length);
    }

    /**
     * Sets the value of the array elements in between start and end to the given constant
     * @param value the value to set
     * @param start the start from which the values should be initialized
     * @param end the end where the value should no longer be set (exclusive)
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
     */
    inline void fill(const T value, int32_t start, int32_t end) {
        int32_t startIndex = start < 0 ? this->length + start : start;
        int32_t endIndex = end < 0 ? this->length + end : end;

 #ifdef SAFE
        if (startIndex < 0 || startIndex >= this->length) {
            throw std::out_of_range { "Start index is out of range" };
        }

        if (endIndex < 0 || endIndex > this->length) {
            throw std::out_of_range { "End index is out of range" };
        }

        if (endIndex < startIndex) {
            return;
        }
 #endif

        std::fill(this->elements + startIndex, this->elements + endIndex, value);
    }

    /**
     * Adds one or several new elements to the and of the array
     * @param elements the elements to add, not a nullptr
     * @param numElements the number of elements to add
     * @return the new length of the array
     */
    inline int32_t push(const T* elements, int32_t numElements) {
        const auto newLength = this->length + numElements;
        this->ensureCapacity(newLength);

        std::copy(elements, elements + numElements, &this->elements[this->length]);
        this->length = newLength;

        return newLength;
    }

    /**
     * Adds an element to the beginning of the array and returns the new length
     * @param elements the elements to add
     * @param numElements the number of elements to add
     * @return the new length after inserting the given element
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
     */
    inline int32_t unshift(const T* elements, int32_t numElements) {
        const int32_t newLength = this->length + numElements;
        this->ensureCapacity(newLength);

        std::copy(this->elements, this->elements + this->length, this->elements + numElements);
        std::copy(elements, elements + numElements, this->elements);

        this->length = newLength;
        return newLength;
    }

    /**
     * Removes the last element and returns it
     * @return the last element
     * @throws {@link std::out_of_range} if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
     */
    inline T pop() {
 #ifdef SAFE
        if (this->length == 0) {
            throw std::out_of_range { "Array is empty" };
        }
 #endif

        return this->elements[--this->length];
    }

    /**
     * Removes the first element and returns it
     * @return the first element
     * @throws {@link std::out_of_range} if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
     */
    inline T shift() {
#ifdef SAFE
        if (this->length == 0) {
            throw std::out_of_range { "Array is empty"};
        }
#endif

        const T element = this->elements[0];
        std::copy(this->elements + 1, this->elements + this->length, this->elements);
        --this->length;
        return element;
    }

    inline Array<T>* splice(int32_t index, int32_t deleteCount, T* elements = nullptr, int32_t elementsCount = 0) {
        if (index < 0) {
            index = this->length + index;
        }

#ifdef SAFE
        if (this->length < index) {
            throw std::out_of_range { "Delete index out of range" };
        }

        if (deleteCount < 0) {
            throw std::out_of_range { "Delete count needs to be a positive number" };
        }

        deleteCount = std::min(this->length - index, deleteCount);
#endif

        if (deleteCount < elementsCount) {
            // Make place for the new items
            this->ensureCapacity(this->length + elementsCount - deleteCount);
        }

        T deletedElements[deleteCount];
        std::copy(this->elements + index, this->elements + index + deleteCount, deletedElements); // safe the deleted elements
        Array<T>* deleted = new Array<T>(deleteCount, deletedElements);

        std::copy(this->elements + index + deleteCount, this->elements + this->length, this->elements + index + elementsCount); // Move the following elements in the right place
        std::copy(elements, elements + elementsCount, this->elements + index); // insert the new elements
        this->length += elementsCount - deleteCount;

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
            throw std::out_of_range("Size needs to be a positive number");
        }
#endif

        ensureCapacity(newSize);

        // No reduce
#ifdef SAFE
        if (this->length < newSize) {
            std::fill_n(&this->elements[this->length], newSize - this->length, T {}); // Default initialize values
        }
#endif

        length = newSize;
    }

private:
    /**
     * Ensures that the capacity of the array is at lest of the given size
     * @param min the minimal required capacity
     */
    void ensureCapacity(int32_t min) {
        if (capacity >= min) {
            return;
        }

        if (min > INT32_MAX) {
            throw std::out_of_range { "Array size exceeded max limit"};
        }

        int32_t newCapacity = capacity == 0 ? DEFAULT_CAPACITY : capacity * CAPACITY_GROW_FACTOR;

        if (newCapacity < min) {
            newCapacity = min;
        }

        if (newCapacity > INT32_MAX) {
            newCapacity = INT32_MAX;
        }

        this->elements = Array<T>::allocateElements(newCapacity, this->elements);
        this->capacity = newCapacity;
    }

    /**
     * (Re) Allocates an array for the elements with the given capacity
     * @param capacity the capacity to allocate
     * @param elements existing pointer to the elements array, in this case, a reallocate is performed
     * @returns the pointer to the allocated array
     */
    static inline T* allocateElements(int32_t capacity, T* elements = nullptr) {
#ifdef SAFE
        if (capacity < 0) {
            throw std::out_of_range("Size needs to be a positive number");
        }
#endif

        if (capacity > INT32_MAX) {
            throw std::out_of_range { "Array size exceeded max limit"};
        }

        auto* allocation = std::realloc(elements, capacity * sizeof(T));

        if (allocation == nullptr) {
            throw std::bad_alloc {};
        }

        return static_cast<T*>(allocation);
    }
};

#endif //SPEEDYJS_RUNTIME_ARRAY_H

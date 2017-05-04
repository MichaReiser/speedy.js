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
    T* begin;

    /**
     * Pointer passed the end of the array
     */
    T* back;

    /**
     * The capacity of the {@link elements}
     */
    size_t capacity;

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

        begin = Array<T>::allocateElements(static_cast<size_t>(size));
        back = &begin[size];

#ifdef SAFE
        if (initialize) {
            // This is quite expensive, if there is a GC that guarantees zeroed memory, this is no longer needed
            std::fill_n(begin, size, T {});
        }
#endif
        capacity = static_cast<size_t>(size);
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
    inline Array(const T* arrayElements, size_t elementsCount) __attribute__((nonnull(2))): Array(elementsCount, false) {
        std::copy(arrayElements, &arrayElements[elementsCount], begin);
    }

    inline ~Array() {
        std::free(begin);
    }

    /**
     * Returns the element at the given index
     * @param index the index of the element to return
     * @return the element at the given index or the default value for T if the index is out of bound (only in safe mode)
     */
    inline T get(int32_t index) const {
 #ifdef SAFE
        if (index < 0 || static_cast<size_t>(index) >= size()) {
            return T {};
        }
 #endif

        return begin[index];
    }

    /**
     * Sets the value at the given index position. The array is resized to a length of the index + 1 if index >= length.
     * @param index the index of the element where the value is to be set
     * @param value the value to set at the given index
     */
    inline void set(int32_t index, T value) const {
 #ifdef SAFE
        if (index < 0 || static_cast<size_t>(index) >= size()) {
            // Throw instead of resizing the array if the index is out of bound. Resizing has the disadvantage that the optimizer
            // might not always be capable to prove that all array accesses are in bound (e.g. merge sort) and therefore
            // cannot optimize the begin ptr load out of the loop. This can be avoided by throwing instead (no resizing,
            // begin ptr remains constant
            throw std::out_of_range("Invalid array index");
        }
 #endif

        begin[index] = value;
    }

    inline void fill(const T value, int32_t start=0) const {
        fill(value, start, length());
    }

    /**
     * Sets the value of the array elements in between start and end to the given constant
     * @param value the value to set
     * @param startIndex the start from which the values should be initialized
     * @param endIndex the end where the value should no longer be set (exclusive)
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
     */
    inline void fill(const T value, int32_t startIndex, int32_t endIndex) const {
        T* start = startIndex < 0 ? &back[startIndex] : &begin[startIndex];
        T* end = endIndex < 0 ? &back[endIndex] : &begin[endIndex];

 #ifdef SAFE
        start = std::min(std::max(start, begin), back);
        end = std::min(std::max(end, start), back);
 #endif

        std::fill(start, end, value);
    }

    /**
     * Adds one or several new elements to the and of the array
     * @param elementsToAdd the elements to add, not a nullptr
     * @param numElements the number of elements to add
     * @return the new length of the array
     */
    inline int32_t push(const T* elementsToAdd, size_t numElements) __attribute__((nonnull(2))) {
        const size_t newLength = size() + numElements;
        ensureCapacity(newLength);

        back = std::copy(elementsToAdd, &elementsToAdd[numElements], back);
        return length();
    }

    /**
     * Adds an element to the beginning of the array and returns the new length
     * @param elementsToAdd the elements to add
     * @param numElements the number of elements to add
     * @return the new length after inserting the given element
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
     */
    inline int32_t unshift(const T* elementsToAdd, size_t numElements) __attribute__((nonnull(2))) {
        const size_t newLength = size() + numElements;
        ensureCapacity(newLength);

        back = std::copy(begin, back, &begin[numElements]);
        std::copy(elementsToAdd, &elementsToAdd[numElements], begin);

        return length();
    }

    /**
     * Removes the last element and returns it
     * @return the last element or the default value of T if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
     */
    inline T pop() {
#ifdef SAFE
        if (size() == 0) {
            return {};
        }
#endif

        const T result = back[-1];
        back--;
        return result;
    }

    /**
     * Removes the first element and returns it
     * @return the first element or the default value of T if the array is empty
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
     */
    inline T shift() {
#ifdef SAFE
        if (size() == 0) {
            return T {};
        }
#endif

        const T element = begin[0];
        back = std::copy(&begin[1], back, begin);
        return element;
    }

    inline Array<T>* slice(int32_t start = 0) const  __attribute__((returns_nonnull)) {
        return slice(start, length());
    }

    /**
     * Returns a copy of the array containing the elements from start to end
     * @see https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
     */
    inline Array<T>* slice(int32_t startIndex, int32_t endIndex) const  __attribute__((returns_nonnull)) {
        T* start = startIndex < 0 ? &back[startIndex] : &begin[startIndex];
        T* end = endIndex < 0 ? &back[endIndex] : &begin[endIndex];

#ifdef SAFE
        start = std::min(start, back);
        end = std::max(start, std::min(end, back));
#endif
        const int32_t elementsCount = static_cast<int32_t>(end - start);
        return new Array<T>(start, end - start);
    }

    inline Array<T>* splice(int32_t index, int32_t deleteCount, T* elementsToAdd = nullptr, size_t elementsCount = 0)  __attribute__((returns_nonnull)) {
#ifdef SAFE
        if (index < 0) {
            index = length() + index;
        }

        index = std::max(std::min(index, length()), 0);
        deleteCount = std::min(std::max(deleteCount, 0), length() - index);
#endif

        return splice(static_cast<size_t>(index), static_cast<size_t>(deleteCount), elementsToAdd, elementsCount);
    }

    inline Array<T>* splice(size_t index, size_t deleteCount, T* elementsToAdd = nullptr, size_t elementsCount = 0)  __attribute__((returns_nonnull)) {
        if (deleteCount < elementsCount) {
            // Make place for the new items
            ensureCapacity(size() + elementsCount - deleteCount);
        }

        T* removeBegin = &begin[index];
        T* removeEnd = &begin[index + deleteCount];
        T* insertEnd = &begin[index + elementsCount];

        // safe the deleted elements
        Array<T>* deleted = new Array<T>(removeBegin, deleteCount);

        // Move the following elements into right place
        back = std::move(removeEnd, back, insertEnd);

        // insert the new elements
        std::copy(elementsToAdd, &elementsToAdd[elementsCount], removeBegin);

        return deleted;
    }

    /**
     * Returns the size of the array
     * @return the size
     */
    inline size_t size() const {
        return back - begin;
    }

    /**
     * Returns the length of the array as int
     * @return the size
     */
    inline int32_t length() const {
        return static_cast<int32_t>(size());
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

       resize(static_cast<size_t>(newSize));
    }

    inline void resize(size_t newSize) {
        ensureCapacity(newSize);

        // No reduce
#ifdef SAFE
        if (size() < newSize) {
            std::fill_n(back, newSize - size(), T {}); // Default initialize values
        }
#endif

        back = begin + newSize;
    }

private:
    /**
     * Ensures that the capacity of the array is at lest of the given size
     * @param min the minimal required capacity
     */
    inline void ensureCapacity(size_t min) {
        if (min < capacity) {
            return;
        }

        size_t newCapacity = capacity == 0 ? DEFAULT_CAPACITY : capacity * CAPACITY_GROW_FACTOR;

        if (static_cast<size_t>(newCapacity) > INT32_MAX) {
            newCapacity = INT32_MAX;
        }

        newCapacity = std::max(newCapacity, static_cast<size_t>(min));
        const size_t length = this->size();
        begin = Array<T>::allocateElements(newCapacity, begin);
        back = begin + length; // update the back pointer for the new allocation

        capacity = newCapacity;
    }

    /**
     * (Re) Allocates an array for the elements with the given capacity
     * @param capacity the capacity to allocate
     * @param elements existing pointer to the elements array, in this case, a reallocate is performed
     * @returns the pointer to the allocated array
     */
    static inline T* allocateElements(size_t capacity, T* elements = nullptr)  __attribute__((returns_nonnull)) {
        void* allocation = std::realloc(elements, capacity * sizeof(T));

        if (allocation == nullptr) {
            throw std::bad_alloc {};
        }

        return static_cast<T*>(allocation);
    }
};

#endif //SPEEDYJS_RUNTIME_ARRAY_H

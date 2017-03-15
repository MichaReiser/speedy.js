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
#include "macros.h"

const size_t CAPACITY_GROW_FACTOR = 2;
const size_t DEFAULT_CAPACITY = 16;

/**
 * Implementation of the JS Array. Grows when more elements are added.
 *
 * Differences to vector:
 * This Class does use memset to default initialize the elements and not the allocator.
 * @tparam T type of the elements stored in the array
 */
template<typename T>
class Array {
public:
    /**
     * The length of the array
     */
    size_t length;

private:
    /**
     * The capacity of the {@link elements}
     */
    size_t capacity;

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
    Array(size_t size, T* elements = nullptr) {
        this->length = size;
        this->capacity = size;

        if (capacity == 0) {
            this->elements = nullptr;
        } else {
            auto* allocation = std::malloc(sizeof(T) * size);
            if (allocation == nullptr) {
                throw std::bad_alloc {};
            }

            this->elements = static_cast<T*>(allocation);

            if (elements == nullptr) {
                std::memset(this->elements, 0, sizeof(T) * size);
            } else {
                std::memcpy(this->elements, elements, size * sizeof(T));
            }
        }
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
    inline T get(size_t index) const {
        if (length <= index) {
            throw std::out_of_range{"Index out of bound"};
        }

        return elements[index];
    }

    /**
     * Sets the value at the given index position. The array is resized to a length of the index + 1 if index >= length.
     * @param index the index of the element where the value is to be set
     * @param value the value to set at the given index
     */
    inline void set(size_t index, T value) {
        if (length <= index) {
            this->resize(index + 1);
        }

        elements[index] = value;
    }

private:
    /**
     * Resizes the array that it can hold at least {@link newSize} elements and updates the array pointer
     * @param array pointer to the array to resize
     * @param newSize the new size
     * @throws {@link std::bad_alloc} if the array could not be allocated
     */
    void resize(size_t newSize) {
        if (capacity < newSize) {
            size_t newCapacity = capacity == 0 ? DEFAULT_CAPACITY : capacity * CAPACITY_GROW_FACTOR;
            if (newCapacity < newSize) {
                newCapacity = newSize;
            }

            auto* allocation = std::realloc(this->elements, newCapacity * sizeof(T));

            if (allocation == nullptr) {
                throw std::bad_alloc {};
            }

            this->elements = static_cast<T*>(allocation);
            this->capacity = newCapacity;
        }

        std::memset(&this->elements[this->length], 0, (newSize - this->length) * sizeof(T)); // Default initialize values

        length = newSize;
    }
};

#endif //SPEEDYJS_RUNTIME_ARRAY_H

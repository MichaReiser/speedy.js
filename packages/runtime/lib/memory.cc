//
// Created by Micha Reiser on 04.04.17.
//

#include <cstdlib>
#include <array>
#include <cassert>
#include "macros.h"

struct CollectedPointers {
    std::array<void*, 1000> pointers;
    size_t count;

    CollectedPointers() : pointers {}, count {}
    {}
};

extern "C" {

extern void malloc_inspect_all(void(*handler)(void*, void *, size_t, void*), void* arg);
extern size_t bulk_free(void**, size_t n_elements);

ALWAYS_INLINE void collectPointers(void* start, void* end, size_t used_bytes, void* callback_arg) {
    auto collectedPointers = static_cast<CollectedPointers*>(callback_arg);

    if (used_bytes > 0 && collectedPointers->count < collectedPointers->pointers.size()) {
        collectedPointers->pointers[collectedPointers->count++] = start;
    }
}

/**
 * Collects all allocated data and calls free. Does not invoke destructors!
 * The helper struct is used as we should not use any heap allocation in this method (otherwise we nuke our own data!)
 */
DLL_PUBLIC ALWAYS_INLINE void speedyJsGc() {
    CollectedPointers collectedPointers {};
    do {
        collectedPointers.count = 0;

        malloc_inspect_all(collectPointers, &collectedPointers);
        auto released = bulk_free(collectedPointers.pointers.data(), collectedPointers.count);
        assert(released == 0 && "Not all pointers freed by bulk_free");
    } while (collectedPointers.count >= collectedPointers.pointers.size());
}

// Probably malloc can be overriden and use emscripten_builtin_malloc to have a custom malloc version
// extern __typeof(malloc) emscripten_builtin_malloc __attribute__((weak, alias("malloc")));
// extern __typeof(free) emscripten_builtin_free __attribute__((weak, alias("free")));
}

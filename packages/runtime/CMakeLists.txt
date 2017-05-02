cmake_minimum_required(VERSION 3.6)
project(speedyjs)

# Following flags need to be set when invoking cmake -DCMAKE_TOOLCHAIN_FILE=~/git/emscripten/cmake/Modules/Platform/Emscripten.cmake
set(CMAKE_CXX_STANDARD 11)
set(SOURCE_FILES lib/array-api.cc lib/macros.h lib/array.h lib/conversion.cc lib/math.cc lib/memory.cc)

set(EM_CONFIG_PATH "${CMAKE_SOURCE_DIR}/.emscripten")
set(EMSCRIPTEN_COMPILE_FLAGS --cache "${CMAKE_SOURCE_DIR}/.emscripten_cache" --em-config "${EM_CONFIG_PATH}")
set(CMAKE_CXX_FLAGS "-pedantic -Wextra -O2")

add_library(speedyjs-runtime STATIC ${SOURCE_FILES})
add_library(speedyjs-runtime-unsafe STATIC ${SOURCE_FILES})

target_compile_options(speedyjs-runtime PRIVATE ${EMSCRIPTEN_COMPILE_FLAGS})
target_compile_options(speedyjs-runtime-unsafe PRIVATE ${EMSCRIPTEN_COMPILE_FLAGS} -DUNSAFE)

add_subdirectory(test EXCLUDE_FROM_ALL)

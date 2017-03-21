cmake_minimum_required(VERSION 3.6)
project(speedyjs-runtime)

# Following flags need to be set when invoking cmake -DCMAKE_TOOLCHAIN_FILE=~/git/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_CXX_COMPILER=/Users/micha/git/emscripten/em++
set(CMAKE_CXX_STANDARD 11)
set(SOURCE_FILES lib/array-api.h lib/macros.h lib/array-api.cc lib/array.h)

add_library(speedyjs-runtime OBJECT ${SOURCE_FILES})
add_library(speedyjs-runtime-unsafe OBJECT ${SOURCE_FILES})

set_target_properties(speedyjs-runtime PROPERTIES COMPILE_FLAGS "--emscripten-cxx --cache ${CMAKE_SOURCE_DIR}/.emscripten_cache")
set_target_properties(speedyjs-runtime-unsafe PROPERTIES COMPILE_FLAGS "--emscripten-cxx --cache ${CMAKE_SOURCE_DIR}/.emscripten_cache -DUNSAFE")

add_subdirectory(test)

# target_link_libraries(speedyjs-runtime)

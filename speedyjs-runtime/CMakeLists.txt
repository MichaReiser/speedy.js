cmake_minimum_required(VERSION 3.6)
project(speedyjs-runtime)

# Following flags need to be set when invoking cmake -DCMAKE_TOOLCHAIN_FILE=~/git/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_CXX_COMPILER=/Users/micha/git/emscripten/em++
# set(CMAKE_TOOLCHAIN_FILE /Users/micha/git/emscripten/cmake/Modules/Platform/Emscripten.cmake)
# set(CMAKE_CXXCOMPILER /Users/micha/git/emscripten/em++)
# set(CMAKE_C_COMPILER /Users/micha/git/emscripten/emcc)

set(CMAKE_CXX_STANDARD 11)
#  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -emit-llvm")

set(SOURCE_FILES lib/array-api.h lib/macros.h lib/array-api.cc lib/array.h)
add_library(speedyjs-runtime OBJECT ${SOURCE_FILES})

add_subdirectory(test)
enable_testing()

# target_link_libraries(speedyjs-runtime)
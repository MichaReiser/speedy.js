cmake_minimum_required(VERSION 3.6)
project(speedyjs-runtime)

# Following flags need to be set when invoking cmake -DCMAKE_TOOLCHAIN_FILE=~/git/emscripten/cmake/Modules/Platform/Emscripten.cmake
set(CMAKE_CXX_STANDARD 11)
set(SOURCE_FILES lib/array-api.h lib/macros.h lib/array-api.cc lib/array.h)
set(EMSCRIPTEN_COMPILE_FLAGS --cache ${CMAKE_SOURCE_DIR}/.emscripten_cache --em-config ${CMAKE_SOURCE_DIR}/.emscripten --emscripten-cxx)

add_library(speedyjs-runtime OBJECT ${SOURCE_FILES})
add_library(speedyjs-runtime-unsafe OBJECT ${SOURCE_FILES})

target_compile_options(speedyjs-runtime PRIVATE ${EMSCRIPTEN_COMPILE_FLAGS})
target_compile_options(speedyjs-runtime-unsafe PRIVATE ${EMSCRIPTEN_COMPILE_FLAGS} -DUNSAFE)

add_subdirectory(test)

# target_link_libraries(speedyjs-runtime)

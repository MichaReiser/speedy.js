cmake_minimum_required(VERSION 3.6)
project(speedyjs-runtime)

set(CMAKE_C++_STANDARD 11)

set(SOURCE_FILES ./lib/runtime.cpp ./include/runtime.h)
add_library(speedyjs-runtime ${SOURCE_FILES})
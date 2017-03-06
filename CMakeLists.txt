cmake_minimum_required(VERSION 3.6)
project(speedyjs)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-rtti")
set(SOURCE_FILES main.cpp code-generator.h code-generator.cpp)

find_package(LLVM REQUIRED CONFIG)

message(STATUS "Found LLVM ${LLVM_PACKAGE_VERSION}")
message(STATUS "Using LLVMConfig.cmake in: ${LLVM_DIR}")

include_directories(${LLVM_INCLUDE_DIRS})
add_definitions(${LLVM_DEFINITIONS})

# Now build our tools
add_executable(speedyjs ${SOURCE_FILES})

# Find the libraries that correspond to the LLVM components that we wish to use
# TODO Only specify needed libs
llvm_map_components_to_libnames(llvm_libs all)


# Link against LLVM libraries
target_link_libraries(speedyjs ${llvm_libs})
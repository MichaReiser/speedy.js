add_subdirectory(googletest)
enable_testing()
include_directories(${gtest_SOURCE_DIR}/include)

set(TEST_SOURCES array.spec.cc)
add_executable(runUnitTests ${TEST_SOURCES})

target_link_libraries(runUnitTests gtest gtest_main)

add_test(AllUnitTests runUnitTests)

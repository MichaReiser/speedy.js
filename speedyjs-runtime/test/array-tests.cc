//
// Created by Micha Reiser on 14.03.17.
//

#include "gtest/gtest.h"
#include "../lib/array.h"

class ArrayTests: public ::testing::Test {
public:
    Array<double>* array;

    void TearDown() {
        if (array != nullptr) {
            delete array;
        }
    }
};

TEST_F(ArrayTests, create_creates_array_of_the_given_size) {
    array = Array<double>::create(1024, nullptr);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->length, 1024);
}

TEST_F(ArrayTests, create_initializes_the_array_with_the_given_elements) {
    double elements[1024] {};
    for (size_t i = 0; i < 1024; ++i) {
        elements[i] = static_cast<double>(i);
    }

    array = Array<double>::create(1024, elements);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->length, 1024);
    EXPECT_EQ(array->get(0), 0);
    EXPECT_EQ(array->get(1023), 1023);
}

TEST_F(ArrayTests, create_initializes_array_elements_with_zero_if_no_elements_is_given) {
    // Create An array an hope that both allocations will use same address...
    double elements[1024] {};
    for (size_t i = 0; i < 1024; ++i) {
        elements[i] = static_cast<int32_t>(i);
    }

    auto* previousArray = Array<double>::create(1024, elements);
    delete previousArray;

    array = Array<double>::create(1024, nullptr);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->get(0), 0);
    EXPECT_EQ(array->get(1023), 0);
}

TEST_F(ArrayTests, get_throws_if_the_index_is_out_of_bound) {
    array = Array<double>::create(100);

    EXPECT_THROW(array->get(1000), std::out_of_range);
}

TEST_F(ArrayTests, set_changes_the_value_at_the_given_index) {
    array = Array<double>::create(100);

    array->set(0, 10);
    array->set(99, 100);

    EXPECT_EQ(array->get(0), 10);
    EXPECT_EQ(array->get(99), 100);
}

TEST_F(ArrayTests, set_resizes_the_array_if_necessary) {
    array = Array<double>::create(100);

    array->set(999, 1000);

    EXPECT_EQ(array->length, 1000);
    EXPECT_EQ(array->get(999), 1000);
}

TEST_F(ArrayTests, set_does_not_keep_existing_values_when_resizing) {
    array = Array<double>::create(10);

    array->set(0, 1);
    array->set(9, 10);

    // act
    array->set(99, 100);

    // assert
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(9), 10);
    EXPECT_EQ(array->get(99), 100);
}

TEST_F(ArrayTests, set_does_initialize_new_elements_with_zero_when_resizing) {
    array = Array<double>::create(10);

    array->set(0, 1);
    array->set(9, 10);

    // act
    array->set(99, 100);

    // assert
    EXPECT_EQ(array->get(10), 0);
    EXPECT_EQ(array->get(98), 0);
}
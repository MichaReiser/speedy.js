//
// Created by Micha Reiser on 14.03.17.
//

#include "gtest/gtest.h"
#include "../lib/array.h"

class ArrayTests: public ::testing::Test {
public:
    Array<double>* array;

    void SetUp() {
        array = nullptr;
    }

    void TearDown() {
        if (array != nullptr) {
            delete array;
        }
    }
};

// -----------------------------------------
// new
// -----------------------------------------

TEST_F(ArrayTests, new_creates_array_of_the_given_size) {
    array = new Array<double>(1024);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->size(), 1024);
}

TEST_F(ArrayTests, new_creates_an_empty_array) {
    array = new Array<double>();

    EXPECT_EQ(array->size(), 0);
}

TEST_F(ArrayTests, new_initializes_the_array_with_the_given_elements) {
    double elements[1024] {};
    for (size_t i = 0; i < 1024; ++i) {
        elements[i] = static_cast<double>(i);
    }

    array = new Array<double>(1024, elements);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->size(), 1024);
    EXPECT_EQ(array->get(0), 0);
    EXPECT_EQ(array->get(1023), 1023);
}

TEST_F(ArrayTests, new_initializes_array_elements_with_zero_if_no_elements_is_given) {
    // Create An array an hope that both allocations will use same address...
    double elements[1024] {};
    for (size_t i = 0; i < 1024; ++i) {
        elements[i] = static_cast<int32_t>(i);
    }

    auto* previousArray = new Array<double>(1024, elements);
    delete previousArray;

    array = new Array<double>(1024);

    ASSERT_NE(array, nullptr);
    EXPECT_EQ(array->get(0), 0);
    EXPECT_EQ(array->get(1023), 0);
}

// -----------------------------------------
// GET
// -----------------------------------------

TEST_F(ArrayTests, get_returns_the_default_value_if_the_index_is_out_of_bound) {
    array = new Array<double>(100);

    EXPECT_EQ(array->get(1000), 0);
}

TEST_F(ArrayTests, get_for_object_array) {
    auto* array1 = new Array<double>();
    auto* array2 = new Array<double>();
    auto* array3 = new Array<double>();

    void* elements[3] = { array1, array2, array3 };
    auto* voidArray = new Array<void*>(3, elements);

    EXPECT_EQ(voidArray->size(), 3);
    EXPECT_EQ(voidArray->get(0), array1);
    EXPECT_EQ(voidArray->get(1), array2);
    EXPECT_EQ(voidArray->get(2), array3);

    delete voidArray;
    delete array1;
    delete array2;
    delete array3;
}

// -----------------------------------------
// SET
// -----------------------------------------

TEST_F(ArrayTests, set_changes_the_value_at_the_given_index) {
    array = new Array<double>(100);

    array->set(0, 10);
    array->set(99, 100);

    EXPECT_EQ(array->get(0), 10);
    EXPECT_EQ(array->get(99), 100);
}

TEST_F(ArrayTests, set_resizes_the_array_if_necessary) {
    array = new Array<double>(100);

    array->set(999, 1000);

    EXPECT_EQ(array->size(), 1000);
    EXPECT_EQ(array->get(999), 1000);
}

TEST_F(ArrayTests, set_does_not_keep_existing_values_when_resizing) {
    array = new Array<double>(10);

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
    array = new Array<double>(10);

    array->set(0, 1);
    array->set(9, 10);

    // act
    array->set(99, 100);

    // assert
    EXPECT_EQ(array->get(10), 0);
    EXPECT_EQ(array->get(98), 0);
}

TEST_F(ArrayTests, set_size_changes_the_length_of_the_array) {
    array = new Array<double>(10);

    // act
    array->resize(20);

    // assert
    EXPECT_EQ(array->size(), 20);
    EXPECT_EQ(array->get(19), 0);
}

TEST_F(ArrayTests, set_size_resizes_an_empty_array) {
    array = new Array<double>();

    // act
    array->resize(10);

    // assert
    EXPECT_EQ(array->size(), 10);
    EXPECT_EQ(array->get(9), 0);
}

// -----------------------------------------
// FILL
// -----------------------------------------

TEST_F(ArrayTests, fill_sets_all_values_to_the_given_constant) {
    array = new Array<double>(10);

    // act
    array->fill(5.0);

    // assert
    EXPECT_EQ(array->get(0), 5.0);
    EXPECT_EQ(array->get(4), 5.0);
    EXPECT_EQ(array->get(9), 5.0);
}

TEST_F(ArrayTests, fill_sets_the_values_from_the_defined_start_position) {
    array = new Array<double>(10);

    // act
    array->fill(5.0, 4);

    // assert
    EXPECT_EQ(array->get(0), 0.0);
    EXPECT_EQ(array->get(3), 0.0);
    EXPECT_EQ(array->get(4), 5.0);
    EXPECT_EQ(array->get(9), 5.0);
}

TEST_F(ArrayTests, fill_sets_the_values_in_between_start_and_end) {
    array = new Array<double>(10);

    // act
    array->fill(5.0, 3, 7);

    // assert
    EXPECT_EQ(array->get(0), 0.0);
    EXPECT_EQ(array->get(2), 0.0);
    EXPECT_EQ(array->get(3), 5.0);
    EXPECT_EQ(array->get(6), 5.0);
    EXPECT_EQ(array->get(7), 0.0);
}

TEST_F(ArrayTests, fill_negative_start_is_treaded_as_length_plus_start) {
    array = new Array<double>(10);

    // act
    array->fill(5.0, -3);

    // assert
    EXPECT_EQ(array->get(0), 0.0);
    EXPECT_EQ(array->get(6), 0.0);
    EXPECT_EQ(array->get(7), 5.0);
    EXPECT_EQ(array->get(9), 5.0);
}

TEST_F(ArrayTests, fill_negative_end_is_treaded_as_length_plus_end) {
    array = new Array<double>(10);

    // act
    array->fill(5.0, -5, -2);

    // assert
    EXPECT_EQ(array->get(0), 0.0);
    EXPECT_EQ(array->get(4), 0.0);
    EXPECT_EQ(array->get(5), 5.0);
    EXPECT_EQ(array->get(7), 5.0);
    EXPECT_EQ(array->get(8), 0.0);
}

TEST_F(ArrayTests, fill_throws_if_start_is_out_of_bound) {
    array = new Array<double>(10);

    // act
    EXPECT_THROW(array->fill(5.0, 10), std::out_of_range);
    EXPECT_THROW(array->fill(5.0, -11), std::out_of_range);
}

TEST_F(ArrayTests, fill_throws_if_end_is_out_of_bound) {
    array = new Array<double>();

    // act
    EXPECT_THROW(array->fill(5.0, 3, 12), std::out_of_range);
    EXPECT_THROW(array->fill(5.0, 3, -11), std::out_of_range);
}

TEST_F(ArrayTests, fill_does_not_change_the_array_if_end_is_less_than_start) {
    array = new Array<double>(4);

    // act
    array->fill(5.0, 2, 0);

    // assert
    EXPECT_EQ(array->get(0), 0);
    EXPECT_EQ(array->get(1), 0);
    EXPECT_EQ(array->get(2), 0);
    EXPECT_EQ(array->get(3), 0);
}

// -----------------------------------------
// PUSH
// -----------------------------------------

TEST_F(ArrayTests, push_adds_the_new_element_at_the_end_of_the_array) {
    array = new Array<double>(5);
    double elements[1] = { 10 };

    // act
    array->push(elements, 1);

    // assert
    EXPECT_EQ(array->size(), 6);
    EXPECT_EQ(array->get(5), 10);
}

TEST_F(ArrayTests, push_adds_the_elements_at_the_end_of_the_array) {
    array = new Array<double>(5);
    double elements[3] = { 1, 2, 3 };

    // act
    array->push(elements, 3);

    // assert
    EXPECT_EQ(array->size(), 8);
    EXPECT_EQ(array->get(5), 1);
    EXPECT_EQ(array->get(6), 2);
    EXPECT_EQ(array->get(7), 3);
}

TEST_F(ArrayTests, push_resizes_if_the_new_length_exceeds_the_capacity) {
    array = new Array<double>();
    double elements[1] = { 1 };

    // act
    array->push(elements, 1);

    // assert
    EXPECT_EQ(array->size(), 1);
    EXPECT_EQ(array->get(0), 1);
}

TEST_F(ArrayTests, push_returns_the_new_array_length) {
    array = new Array<double>(5);
    double elements[2] = { 1, 2 };

    // act, assert
    EXPECT_EQ(array->push(elements, 2), 7);
}

// -----------------------------------------
// UNSHIFT
// -----------------------------------------

TEST_F(ArrayTests, unshift_adds_the_element_to_the_beginning_of_the_array) {
    array = new Array<double>(5);
    double toAdd[1] = { 1 };

    // act
    array->unshift(toAdd, 1);

    // assert
    EXPECT_EQ(array->size(), 6);
    EXPECT_EQ(array->get(0), 1);
}

TEST_F(ArrayTests, unshift_returns_the_new_size_of_the_array) {
    array = new Array<double>(5);
    double toAdd[2] = {1, 2};

    // act, assert
    EXPECT_EQ(array->unshift(toAdd, 2), 7);
}

TEST_F(ArrayTests, unshift_moves_the_existing_elements_to_the_back) {
    array = new Array<double>(5);
    array->set(0, 1);
    array->set(1, 2);
    array->set(2, 3);
    array->set(3, 4);
    array->set(4, 5);

    double toAdd[1] = { 0 };

    // act
    array->unshift(toAdd, 1);

    // assert
    EXPECT_EQ(array->get(1), 1);
    EXPECT_EQ(array->get(2), 2);
    EXPECT_EQ(array->get(3), 3);
    EXPECT_EQ(array->get(4), 4);
    EXPECT_EQ(array->get(5), 5);
}

TEST_F(ArrayTests, unshift_resizes_the_container_if_necessary) {
    array = new Array<double>(0);

    double toAdd[1] = { 1 };

    // act
    array->unshift(toAdd, 1);

    EXPECT_EQ(array->size(), 1);
    EXPECT_EQ(array->get(0), 1);
}

// -----------------------------------------
// POP
// -----------------------------------------

TEST_F(ArrayTests, pop_returns_and_removes_the_last_element) {
    array = new Array<double>(5);
    array->set(4, 5);
    array->set(3, 4);

    // act
    double result = array->pop();

    // assert
    EXPECT_EQ(result, 5);
    EXPECT_EQ(array->size(), 4);
    EXPECT_EQ(array->get(3), 4);
}

TEST_F(ArrayTests, pop_throws_if_the_array_is_empty) {
    array = new Array<double>(0);

    EXPECT_THROW(array->pop(), std::out_of_range);
}

// -----------------------------------------
// SHIFT
// -----------------------------------------
TEST_F(ArrayTests, shift_returns_and_removes_the_first_element) {
    array = new Array<double>(5);
    array->set(0, 1);
    array->set(1, 2);

    // act
    double result = array->shift();

    // assert
    EXPECT_EQ(result, 1);
    EXPECT_EQ(4, array->size());
}

TEST_F(ArrayTests, shift_moves_the_remaining_elements_in_front) {
    array = new Array<double>(5);
    array->set(1, 1);
    array->set(2, 2);
    array->set(3, 3);
    array->set(4, 4);

    // act
    array->shift();

    // assert
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
    EXPECT_EQ(array->get(2), 3);
    EXPECT_EQ(array->get(3), 4);
}

TEST_F(ArrayTests, shift_throws_if_the_array_is_empty) {
    array = new Array<double>(0);

    // act, assert
    EXPECT_THROW(array->shift(), std::out_of_range);
}

// -----------------------------------------
// slice
// -----------------------------------------
TEST_F(ArrayTests, slice_returns_a_copy_of_the_array) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice();

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 5);
    EXPECT_EQ(copy->get(0), 1);
    EXPECT_EQ(copy->get(1), 2);
    EXPECT_EQ(copy->get(2), 3);
    EXPECT_EQ(copy->get(3), 4);
    EXPECT_EQ(copy->get(4), 5);

    delete copy;
}

TEST_F(ArrayTests, slice_returns_a_subset_starting_from_the_specified_start) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(2);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 3);
    EXPECT_EQ(copy->get(0), 3);
    EXPECT_EQ(copy->get(1), 4);
    EXPECT_EQ(copy->get(2), 5);

    delete copy;
}

TEST_F(ArrayTests, slice_returns_the_subset_in_between_start_and_end) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(1, 3);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 2);
    EXPECT_EQ(copy->get(0), 2);
    EXPECT_EQ(copy->get(1), 3);

    delete copy;
}

TEST_F(ArrayTests, slice_with_a_start_larger_than_the_array_returns_an_empty_array) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(10, 15);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 0);

    delete copy;
}

TEST_F(ArrayTests, slice_with_a_negative_start_computes_the_start_from_the_end) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(-2);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 2);
    EXPECT_EQ(copy->get(0), 4);
    EXPECT_EQ(copy->get(1), 5);

    delete copy;
}

TEST_F(ArrayTests, slice_with_a_negative_end_computes_the_end_from_the_end) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(2, -1);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 2);
    EXPECT_EQ(copy->get(0), 3);
    EXPECT_EQ(copy->get(1), 4);

    delete copy;
}

TEST_F(ArrayTests, slice_returns_an_empty_array_if_start_is_larger_than_the_end) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* copy = array->slice(3, 1);

    EXPECT_NE(&copy, &array);
    EXPECT_EQ(copy->size(), 0);

    delete copy;
}

// -----------------------------------------
// splice
// -----------------------------------------
TEST_F(ArrayTests, splice_removes_the_number_of_elements) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* deleted = array->splice(2, 2);
    delete deleted;

    // assert
    EXPECT_EQ(3, array->size());
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
    EXPECT_EQ(array->get(2), 5);
}

TEST_F(ArrayTests, splice_returns_an_array_containing_the_deleted_elements) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* deleted = array->splice(2, 2);

    // assert
    EXPECT_EQ(2, deleted->size());
    EXPECT_EQ(deleted->get(0), 3);
    EXPECT_EQ(deleted->get(1), 4);

    delete deleted;
}

TEST_F(ArrayTests, splice_removes_the_elements_and_inserts_the_new_ones) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    double toInsert[1] = { 2.5 };

    // act
    Array<double>* deleted = array->splice(2, 2, toInsert, 1);
    delete deleted;

    // assert
    EXPECT_EQ(4, array->size());
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
    EXPECT_EQ(array->get(2), 2.5);
    EXPECT_EQ(array->get(3), 5);
}

TEST_F(ArrayTests, splice_shifts_the_new_elements_to_the_back_if_more_elements_are_inserted_than_removed) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    double toInsert[3] = { 2.25, 2.5, 2.75 };

    // act
    Array<double>* deleted = array->splice(2, 2, toInsert, 3);
    delete deleted;

    // assert
    EXPECT_EQ(6, array->size());
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
    EXPECT_EQ(array->get(2), 2.25);
    EXPECT_EQ(array->get(3), 2.50);
    EXPECT_EQ(array->get(4), 2.75);
    EXPECT_EQ(array->get(5), 5);
}

TEST_F(ArrayTests, splice_removes_all_elements_from_the_index_if_deleteCount_is_larger_than_the_length) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* deleted = array->splice(2, 10);
    delete deleted;

    // assert
    EXPECT_EQ(2, array->size());
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
}

TEST_F(ArrayTests, splices_inserts_from_the_back_if_the_index_is_negative) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    Array<double>* deleted = array->splice(-3, 2);
    delete deleted;

    // assert
    EXPECT_EQ(3, array->size());
    EXPECT_EQ(array->get(0), 1);
    EXPECT_EQ(array->get(1), 2);
    EXPECT_EQ(array->get(2), 5);
}

TEST_F(ArrayTests, splice_throws_if_delete_count_is_negative) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    EXPECT_THROW(array->splice(2, -3), std::out_of_range);
}

TEST_F(ArrayTests, splice_throws_if_index_is_out_of_range) {
    double elements[5] = {1, 2, 3, 4, 5};
    array = new Array<double>(5, elements);

    // act
    EXPECT_THROW(array->splice(10, 2), std::out_of_range);
}


// -----------------------------------------
// size
// -----------------------------------------
TEST_F(ArrayTests, size_returns_the_size_of_the_array) {
    array = new Array<double>(5);

    EXPECT_EQ(array->size(), 5);
}

// -----------------------------------------
// resize
// -----------------------------------------
TEST_F(ArrayTests, resize_increases_the_size_of_the_array_if_the_new_size_is_larger) {
    array = new Array<double>(5);

    // act
    array->resize(20);

    // expect
    EXPECT_EQ(array->size(), 20);
}

TEST_F(ArrayTests, resize_new_elements_are_initialized_with_zero) {
    array = new Array<double>(5);

    // act
    array->resize(20);

    // expect
    EXPECT_EQ(array->get(5), 0);
    EXPECT_EQ(array->get(19), 0);
}

TEST_F(ArrayTests, resize_decreases_the_size_of_the_array_if_the_new_size_is_smaller) {
    array = new Array<double>(20);

    // act
    array->resize(10);

    // expect
    EXPECT_EQ(array->size(), 10);
}
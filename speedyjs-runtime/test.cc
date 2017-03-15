//
// Created by Micha Reiser on 10.03.17.
//

#include "lib/runtime.h"

long int* createArray(long int first_value) {
    long int iArr[3] = { first_value, 2, 3};
    return iArr;
}


int main() {
    long int* iArr = createArray(1);
    void* arr = new_array_i32(40001, iArr);
    return array_get_i32(arr, 2);
}

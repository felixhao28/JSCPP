#include <iostream>

int func(int x);

int main() {
    int a = 10;
    int b = 0;
    int c;
    b = func(a);
    c = func(10);
    return b + c;
}

int func(int x){
    //some code 
    return 2 * x;
}
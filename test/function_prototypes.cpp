#include <iostream>

int func(int x);

int main() {
    int a = 10;
    int b = 0;    
    b = func(a);
    return b;
}

int func(int x){
    //some code 
    return 2 * x;
}
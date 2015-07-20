#include <iostream>
using namespace std;
unsigned char A=0;
unsigned char B=0x80;
int main() {
    A = ~B;
    cout << (unsigned int)A << endl;
    return 0;
}
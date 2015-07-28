#include <iostream>
#include <string.h>
using namespace std;

int main() {
    cout << sizeof("1") << ' ';
    cout << sizeof("11") << ' ';
    cout << sizeof("\u007f") << ' ';
    cout << sizeof("11") << ' ';
    cout << sizeof("\u0080\u003f") << ' ';
    char сstring[]="123";
    cout << sizeof(сstring) << ' ';
    wchar_t wstring[]="\u0080\u003f";
    cout << sizeof(wstring);
    return 0;
}

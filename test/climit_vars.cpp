#include <climits>
#include <iostream>

using namespace std;

int main() {
    cout <<
        CHAR_BIT << " " <<
        SCHAR_MIN << " " <<
        SCHAR_MAX << " " <<
        UCHAR_MAX << " " <<
        CHAR_MIN << " " <<
        CHAR_MAX << " " <<
        MB_LEN_MAX << " " <<
        SHRT_MIN << " " <<
        SHRT_MAX << " " <<
        USHRT_MAX << " " <<
        INT_MIN << " " <<
        INT_MAX << " " <<
        UINT_MAX << " " <<
        LONG_MIN << " " <<
        LONG_MAX << " " <<
        ULONG_MAX << " " <<
        LLONG_MIN << " " <<
        LLONG_MAX << " " <<
        ULLONG_MAX;
    
    return 0;
}
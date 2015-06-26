#include <iostream>
#include <cmath>
#include <iomanip>
using namespace std;
int main() {
    cout << fixed << setprecision(4);
    cout << cos(123.456) << endl;
    cout << sin(123.456) << endl;
    cout << tan(123.456) << endl;
    cout << acos(0.456) << endl;
    cout << asin(0.456) << endl;
    cout << atan(123.456) << endl;
    cout << atan2(123.456, 234.567) << endl;
    cout << cosh(0.456) << endl;
    cout << sinh(0.456) << endl;
    cout << tanh(123.456) << endl;
    cout << acosh(123.456) << endl;
    cout << asinh(123.456) << endl;
    cout << atanh(0.5) << endl;
    cout << exp(12.3) << endl;
    cout << log(123.456) << endl;
    cout << log10(123.456) << endl;
    cout << sqrt(123.456) << endl;
    cout << ceil(123.456) << endl;
    cout << floor(123.456) << endl;
    cout << fabs(123.456) << endl;
    cout << abs(123.456) << endl;
    return 0;
}
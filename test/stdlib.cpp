#include <iostream>
#include "stdlib.h"
using namespace std;
int main() {
  cout << atof("1.234") << endl;
  cout << atoi("1234") << endl;
  cout << atol("1234") << endl;
  cout << abs(-1234) << endl;
  cout << div(7, 3).quot << endl;
  cout << div(7, 3).rem << endl;
  cout << labs(-1234) << endl;
  cout << ldiv(7, 3).quot << endl;
  cout << ldiv(7, 3).rem << endl;
  return 0;
}
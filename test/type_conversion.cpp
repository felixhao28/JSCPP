#include <iostream>
using namespace std;
int main() {
  int a;
  a = 1000.5;
  cout << a << endl;
  double b;
  b = 1000 / 333;
  cout << b << endl;
  b = (double)1000 / 3; // 333.33
  cout << (int)(b * 10) << endl; // correct: 3333, incorrect: 3330
  return 0;
}
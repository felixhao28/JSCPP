#include <iostream>
using namespace std;

int f1() {
  return 10;
}

int f2(int x) {
  x = x * 5;
  return x * 2;
}

int f3(int x, int y) {
  return x + f2(y);
}

void f4(int x, int y) {
  x = x + y;
  y = y - 10;
  cout << x << ' ' << y << endl;
}

int main() {
  int a = 5, b = 10;
  cout << f1() << endl;
  cout << f2(a) << endl;
  cout << f3(a, b) << endl;
  f4(a, b);
  cout << a << ' ' << b << endl;
  return 0;
}
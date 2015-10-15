#include<iostream>
using namespace std;

int c[] = { 2, 3, 4 };

int f(int a, int b[] = c) {
  return a + b[0];
}

int f2(int a, int b = 2, int c = 3) {
  return a + b + c;
}

int main() {
  int b[] = { 1, 2, 3 };
  cout << f(1) << endl;
  cout << f(1, b) << endl;
  cout << f2(1, 4, 5) << endl;
  cout << f2(1, 4) << endl;
  cout << f2(1) << endl;
  return 0;
}
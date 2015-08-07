#include <iostream>
using namespace std;

int f(int a, int b){
  return a + b;
}

int f2(int *a, int *b){
	return *a + *b;
}

int main() {
  int a, b;
  int (*p)(int, int);
  p = &f;
  cin >> a >> b;
  cout << f(a, b) << endl;
  int (*p2)(int*, int*);
  p2 = &f2;
  cout << p2(&a, &b) << endl;
  return 0;
}
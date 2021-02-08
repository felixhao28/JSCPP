#include <iostream>
using namespace std;

int g(int (*p)(int, int), int a, int b){
  return p(a, b) * 2;
}

int f(int a, int b){
	return a + b;
}

int main() {
  int a, b;
  cin >> a >> b;
  cout << f(a, b) << endl;
  cout << g(&f, a, b) << endl;
  return 0;
}
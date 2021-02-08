#include <foo>
#include <iostream>
using namespace std;

int f(int* x) {
  cout << "f:" << *x << endl;
  *x += 3;
  return *x;
}

int main()
{
  Foo foo;
  cout << foo.x << ',' << foo.y << endl;
  cout << foo.plusX(5) << endl;
  int x = 123;
  int r = foo.callback(&f,&x);
  cout << "foo.callback:" << r << endl;
  return 0;
}
#include <foo>
#include <iostream>
using namespace std;

int main()
{
  Foo foo;
  cout << foo.x << ',' << foo.y << endl;
  cout << foo.plusX(5) << endl;
  return 0;
}
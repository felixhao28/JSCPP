#include <iostream>
using namespace std;

typedef int* p_int;

p_int pmax(int* a, int* b){
  return (*a > *b)?a:b;
}

int main() {
  int a,b;
  cin >> a >> b;
  cout << *pmax(&a,&b) << endl;
  return 0;
}

#include <iostream>
using namespace std;
int main() {
  for (int i = 0; i < 10; i++) {
    if (i % 2 == 1)
      continue;
    if (i == 6)
      break;
    cout << i << endl;
  }
  cout << "========" << endl;
  int x = 0;
  while (x++ < 10) {
    if (x % 3 == 2)
      continue;
    cout << x << endl;
  }
  cout << "========" << endl;
  do {
    if (x % 3 == 0) {
      x -= 2;
      continue;
    }
    cout << x << endl;
    x--;
  } while (x > 0);
  return 0;
}
#include <iostream>
#include <cstring>

using namespace std; 

int main() {
  char *s1 = "Hello";
  char *s2 = "Bye!!";
  cout << (strcmp(s1, s2) > 0 ? "yes" : "no") << endl;  // ok
  cout << (strcmp(s1, s1) == 0 ? "yes" : "no") << endl;  // ERROR!!!

  return 0;
}
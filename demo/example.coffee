#JSCPP = require "JSCPP"
JSCPP = require "../lib/main"

code = """
#include <iostream>
using namespace std;
int main() {
  int a;
  cin >> a;
  cout << a << endl;
  return 0;
}
"""
input = "4321"

exitcode = JSCPP.run(code, input)
console.info("\nprogram exited with code #{exitcode}")

#include <iostream>
#include <cstring>
using namespace std;

int main() {
  int n;
  cin >> n;
  char word[50];
  int charsThisLine = 0;
  for (int i = 0; i < n; i++) {
    cin >> word;
    int len = strlen(word);
    bool prefixSpace = charsThisLine > 0;
    int expectedLen = charsThisLine + (prefixSpace ? 1 : 0) + len;
    if (expectedLen <= 80) {
      if (prefixSpace) {
        charsThisLine += 1;
        cout << ' ';
      }
      cout << word;
      charsThisLine += len;
    } else {
      cout << endl << word;
      charsThisLine = len;
    }
  }
  cout << endl;
  return 0;
}
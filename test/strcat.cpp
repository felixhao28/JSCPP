#include <iostream>
#include <string.h>

using namespace std;

int main () {

   char str1[10] = "111";
   char str2[10] = "222";
   char str3[10];

   // concatenates str1 and str2
   strcat( str1, str2);
   cout << "strcat( str1, str2): " << str1 << endl;

   return 0;
}
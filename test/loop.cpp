#include<iostream>
using namespace std;
int main()
{
  int min = 0, max = 0, sum = 0;
  cin >> min >> max;
  for (int i = min; i <= max; i++)
    if (i % 2 == 1)
      sum += i;
  cout << sum << endl;
  return 0;
}
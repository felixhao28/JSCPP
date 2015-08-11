#include <cstdlib>
#include <iostream>
using namespace std;

int  main()
{
	int seed;
	cin >> seed;
	srand(seed);
	cout << rand() << endl;
	cout << rand() << endl;
	cout << rand() << endl;
	return 0;
}
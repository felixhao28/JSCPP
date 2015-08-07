#include <iostream>
using namespace std;

// simple typedef
typedef unsigned long ulong;
 
// the following two objects have the same type
unsigned long l1;
ulong l2;

// more complicated typedef
typedef int int_t, *intp_t, (*fp)(int, int*, ulong), arr_t[10];
 
// the following two objects have the same type
int a1[10];
arr_t a2;

int f(int a, int* b, ulong c) {
	return a + *b + c;
}

int main()
{
	// equal
	cout << sizeof(l1) - sizeof(l2) << endl; // 0
	// equal
	a1[9] = 1.2;
	a2[9] = 1.9;
	cout << a1[9] - a2[9] << endl; // 0
	// int_t
	int_t x = 3.8;
	cout << x << endl; // 3
	// intp_t
	intp_t y = &x;
	cout << *y << endl; // 3
	// fp
	fp q = &f;
	cout << q(1, y, 3) << endl; // 7
	return 0;
}
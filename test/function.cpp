#include <iostream>
using namespace std;

int f1 () {
	return 10;
}

int f2 (int x) {
	return x * 10;
}

int f3 (int x ,int y) {
	return x + f2(y);
}

int main() {
	cout << f1() << endl;
	cout << f2(5) << endl;
	cout << f3(5, 7) << endl;
	return 0;
}
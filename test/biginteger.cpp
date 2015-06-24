#include<iostream>
#include<cstring>
using namespace std;

char str1[201], str2[201];
int a1[200] = { 0 }, a2[201] = { 0 };

int main() {
	int i;
	cin >> str1 >> str2;
	int len1 = strlen(str1);
	int len2 = strlen(str2);

	for (i = 0; i < len1; i++) {
		a1[i] = str1[len1 - 1 - i] - '0';
	}
	for (i = 0; i < len2; i++) {
		a2[i] = str2[len2 - 1 - i] - '0';
	}

	for (i = 0; i < 200; i++) {
		a2[i] += a1[i];
		if (a2[i] >= 10) {
			a2[i] -= 10;
			a2[i + 1]++;
		}
	}

	for (i = 200; i >= 0; i--) {
		if (a2[i] != 0)
			break;
	}

	if (i == -1)
		cout << 0;
	else
		for (; i >= 0; i--)
			cout << a2[i];
	cout << endl;
	return 0;
}
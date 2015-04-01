#include<iostream>
using namespace std;

int main(){
	int num[100];
	int n;
	cin >> n;
	for (int i = 0; i < n; i++){
		cin >> num[i];
	}

	for (int i = 0; i < n; i++){
		cout << num[n - 1 - i]<< " ";
	}
	cout << endl;
	return 0;
}
#include <iostream>
using namespace std;
int  main()
{
    int a;
    cin >> a;
    cout << a << endl;
    char x[80];
    a = cin.get();
    cout << (int)a << endl;
    cin.getline(x, 80);
    cout << x << endl;
    cin.getline(x, 80);
    cout << x << endl;
    return 0;
}
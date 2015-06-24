#include <iostream>
using namespace std;
int main() {
    char s1[80], s2[80];
    cin >> s1 >> s2;

    for (int i = 0; i < 80; i++) {
        char c1 = s1[i];
        char c2 = s2[i];
        if (c1 == '\0' && c2 == '\0') {
            cout << '=' << endl;
            break;
        } else if ( c1 == '\0') {
            cout << '<' << endl;
            break;
        } else if ( c2 == '\0') {
            cout << '>' << endl;
            break;
        }

        if (c1 >= 'A' && c1 <= 'Z')
            c1 = 'a' + c1 - 'A';
        if (c2 >= 'A' && c2 <= 'Z')
            c2 = 'a' + c2 - 'A';

        if (c1 > c2) {
            cout << '>' << endl;
            break;
        } else if (c1 < c2) {
            cout << '<' << endl;
            break;
        }
    }

    return 0;
}
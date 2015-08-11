#include <iostream>

using namespace std;

int main() {

    int n = 0, m = 0;
    char a[100][100];
    cin >> n;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            cin >> a[i][j];

    cin >> m;
    m--;
    while (m--) {
        for (int i2 = 0; i2 < n; i2++)
            for (int j2 = 0; j2 < n; j2++) {
                if (a[i2][j2] == '@') {
                    if (i2 > 0 && a[i2 - 1][j2] == '.')
                        a[i2 - 1][j2] = 1;
                    if (i2 < n - 1 && a[i2 + 1][j2] == '.')
                        a[i2 + 1][j2] = 1;
                    if (j2 > 0 && a[i2][j2 - 1] == '.')
                        a[i2][j2 - 1] = 1;
                    if (j2 < n - 1 && a[i2][j2 + 1] == '.')
                        a[i2][j2 + 1] = 1;
                }
            }
        for (int i3 = 0; i3 < n; i3++)
            for (int j3 = 0; j3 < n; j3++) {
                if (a[i3][j3] == 1)
                    a[i3][j3] = '@';
            }
    }

    int c = 0;
    for (int i4 = 0; i4 < n; i4++)
        for (int j4 = 0; j4 < n; j4++)
            if (a[i4][j4] == '@')
                c++;

    cout << c << endl;

    return 0;

}
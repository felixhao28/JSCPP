#include <iostream>
#include <string.h>
using namespace std;

int go(char str[], int start, int len, int level, char out[]) {
    for (int i = start; i < len; i++) {
        if (str[i] == '(') {
            int ret = go(str, i + 1, len, level + 1, out);
            if (ret == -1) {
                out[i] = '$';
                return -1;
            } else {
                i += ret;
            }
        } else if (str[i] == ')') {
            if (level == 0) {
                out[i] = '?';
            } else
                return i - start + 1;
        } else {

        }
    }
    return -1;
}

int main() {
    char str[210];
    char out[210];
    while (cin.getline(str, 210)) {
        int len = strlen(str);
        for (int i = 0; i < len; i++) {
            out[i] = ' ';
        }
        out[len] = '\0';
        go(str, 0, len, 0, out);
        cout << str << endl;
        cout << out << endl;
    }
    return 0;
}
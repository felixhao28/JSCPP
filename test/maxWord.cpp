#include<iostream>
using namespace std;
int main() {
    int maxLen = 0;
    char maxWord[21];
    while (true) {
        char tmpWord[21];
        cin >> tmpWord;
        int tmpLen = 0;
        for (; ; tmpLen++) {
            if (tmpWord[tmpLen] == '\0' || tmpWord[tmpLen] == '.')
                break;
        }
        if (tmpLen > maxLen) {
            maxLen = tmpLen;
            for (int i = 0; i < tmpLen; i++)
                maxWord[i] = tmpWord[i];
            maxWord[maxLen] = '\0';
        }
        if (tmpWord[tmpLen] == '.')
            break;
    }
    cout << maxWord << endl;
    return 0;
}
#include <stdio.h>

int main() {
    float tab[2];
    tab[0] = 1;
    for(int i = 0; i < 2; i++){
        printf("%f, ", tab[i]);
    }
    return 0;
}
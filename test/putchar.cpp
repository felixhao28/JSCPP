#include <stdio.h>
#include <cstring>

int main()
{
    char* inputs = "hello\n12345678    \n!@#$%^&*('~&\n\0";
    for(int i = 0;i<strlen(inputs);i++){
        putchar(inputs[i]);
    }
    return(0);
}
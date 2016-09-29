#include <stdio.h>
int main()
{
    char str[50];
    gets(str);
    printf("%s", str);
    gets(str);
    printf("%s", str);
    gets(str);
    printf("%s", str);
    return(0);
}
#include <stdio.h>

int main ()
{
   char c;
   while ((c = getchar()) != 0){
        printf("%c",c);
    }
   return 0;
}
#include <stdio.h>
#include <stdlib.h>

int main()
{
   int day, year;
   char weekday[20], month[20], dtm[100];

   sscanf( "Saturday March 25 1989\n" , "%s %s %d  %d", weekday, month, &day, &year );

   printf("%s %d,%d = %s\n", month, day, year, weekday );

   return(0);
}
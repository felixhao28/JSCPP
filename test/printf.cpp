#include <cstdio>

int main() {
    printf("boo\n");
    printf("% 5d\n", -42);
    printf("%+5d\n", 42);
    printf("%05d\n", 42);
    printf("%-5d\n", 42);
    printf("%.2f\n", 42.8952);
    printf("%06.2f\n", 42.8952);
    printf("%c\n", 0x7f);
    printf("%c\n", 'a');
    printf("%c\n", 34);
    printf("%d%%\n", 10);
    printf("+%s+\n", "hello");
    printf("%c\n", 36);
    return 0;
}
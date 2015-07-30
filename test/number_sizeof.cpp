#include <iostream>
using namespace std;
int  main()
{
    int n_int=1;
    unsigned int n_uint=36746;
    long int n_longint=1234567890;
    long long int n_longlongint=1234567890;
    unsigned long int n_ulongint=1234;
    unsigned long long int n_ulonglongint=1234567890;
    char n_char=33;
  cout
    << (sizeof(1+2) == sizeof(int))
    << (sizeof(n_uint+2) == sizeof(unsigned int))
    << (sizeof(n_longint+n_uint) == sizeof(long int))
    << (sizeof(n_ulongint+n_int) == sizeof(unsigned long int))
    << (sizeof(n_longlongint+n_uint) == sizeof(long long int))
    << (sizeof(n_longlongint+n_longint) == sizeof(long long int))
    << (sizeof(n_longlongint+n_ulongint) == sizeof(long long int))
    << (sizeof(n_longlongint+n_ulonglongint) == sizeof(unsigned long long int))
    << (sizeof(n_ulonglongint+n_char) == sizeof(long long int))
  ;
  return 0;
}

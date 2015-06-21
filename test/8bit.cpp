int main()
{
  unsigned char x = 253;
  x++; // 254
  x++; // 255
  x++; // 6:3 overflow during post-increment 256(unsigned char)
  x++;
  x = x + 1;
  return x;
}
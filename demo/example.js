var JSCPP, code, exitcode, input;

JSCPP = require("../lib/main");

code = "#include <iostream>\nusing namespace std;\nint main() {\n  int a;\n  cin >> a;\n  cout << a << endl;\n  return 0;\n}";

input = "4321";

exitcode = JSCPP.run(code, input);

console.info("\nprogram exited with code " + exitcode);

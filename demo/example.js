var JSCPP, code, exitcode, input;

JSCPP = require("../lib/main");

code = "#include <iostream>\nusing namespace std;\nint main() {\n\n    int n = 0, m = 0;\n    char a[100][100];\n    cin >> n;\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < n; j++)\n            cin >> a[i][j];\n\n    cin >> m;\n    m--;\n    while (m--) {\n        for (int i2 = 0; i2 < n; i2++)\n            for (int j2 = 0; j2 < n; j2++) {\n                if (a[i2][j2] == '@') {\n                    if (i2 > 0 && a[i2 - 1][j2] == '.')\n                        a[i2 - 1][j2] = 1;\n                    if (i2 < n - 1 && a[i2 + 1][j2] == '.')\n                        a[i2 + 1][j2] = 1;\n                    if (j2 > 0 && a[i2][j2 - 1] == '.')\n                        a[i2][j2 - 1] = 1;\n                    if (j2 < n - 1 && a[i2][j2 + 1] == '.')\n                        a[i2][j2 + 1] = 1;\n                }\n            }\n        for (int i3 = 0; i3 < n; i3++)\n            for (int j3 = 0; j3 < n; j3++) {\n                if (a[i3][j3] == 1)\n                    a[i3][j3] = '@';\n            }\n    }\n\n    int c = 0;\n    for (int i4 = 0; i4 < n; i4++)\n        for (int j4 = 0; j4 < n; j4++)\n            if (a[i4][j4] == '@')\n                c++;\n\n    cout << c << endl;\n\n    return 0;\n\n}";

input = "5\n....#\n.#.@.\n.#@..\n#....\n.....\n4";

exitcode = JSCPP.launcher.run(code, input);

console.info("\nprogram exited with code " + exitcode);

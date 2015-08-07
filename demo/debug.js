var JSCPP, argv, cases, code, config, cppFile, exitcode, fs, i, input, j, l, lastOutputPos, len, mydebugger, onPrompt, readline, rl, srcLines, testName, tests, yaml;

JSCPP = require("../lib/main");

yaml = require("js-yaml");

fs = require("fs");

argv = require("minimist")(process.argv.slice(2));

config = {};

if (process.argv.length > 2) {
  testName = argv._[0];
  if (argv.d || argv.debug) {
    config.debug = true;
  }
  if (argv.i || argv["in"]) {
    input = argv.i || argv["in"];
  }
  if (argv.f || argv.file) {
    code = fs.readFileSync(argv.f || argv.file);
    input || (input = "");
  } else {
    tests = yaml.safeLoad(fs.readFileSync("test/test.yaml"));
    cases = tests.tests[testName].cases;
    if (Array.isArray(cases)) {
      cases = cases[0];
    }
    cppFile = cases.cpp;
    input = cases["in"] || "";
    code = fs.readFileSync("./test/" + cppFile);
  }
  if (!config.debug) {
    exitcode = JSCPP.run(code, input, config);
    console.info("\nprogram exited with code " + exitcode);
  } else {
    mydebugger = JSCPP.run(code, input, config);
    console.log("Available commands:\nn, next           : step into\nt, type <name>      : internal details of a type <name>\nv, var, variable      : all local variables\nv, var, variable <name>   : a variable called <name>\nc, current, pos, position : current position in source\n");
    readline = require("readline");
    rl = readline.createInterface(process.stdin, process.stdout);
    rl.setPrompt("\ndebug> ");
    srcLines = mydebugger.src.split("\n");
    for (i = j = 0, len = srcLines.length; j < len; i = ++j) {
      l = srcLines[i];
      console.log((i + 1) + ":\t" + l);
    }
    onPrompt = function() {
      var line, stmt;
      while ((stmt = mydebugger.nextNode()) == null) {
        mydebugger.next();
      }
      console.log("\n\n");
      line = stmt.sLine;
      if (line > 1) {
        console.log(("  " + (line - 1) + ":\t") + srcLines[line - 2]);
      }
      console.log(("==> " + line + ":\t") + srcLines[line - 1]);
      if (line < srcLines.length) {
        return console.log(("  " + (line + 1) + ":\t") + srcLines[line]);
      }
    };
    onPrompt();
    rl.prompt();
    String.prototype.startsWith = function(s) {
      return this.slice(s.length) === s;
    };
    lastOutputPos = 0;
    rl.on("line", function(line) {
      var cmds, done, e, s;
      try {
        done = false;
        cmds = line.trim().split(" ");
        switch (cmds[0]) {
          case "n":
          case "next":
            done = mydebugger["continue"]();
            break;
          case "t":
          case "type":
            console.log(mydebugger.type(cmds[1]));
            break;
          case "v":
          case "var":
          case "variable":
            console.log(mydebugger.variable(cmds[1]));
            break;
          case "c":
          case "current":
          case "pos":
            s = mydebugger.nextNode();
            console.log(s.sLine + ":" + s.sColumn + "(" + s.sOffset + ") - " + s.eLine + ":" + s.eColumn + "(" + s.eOffset + ")");
        }
      } catch (_error) {
        e = _error;
        console.log("command failed: " + e.stack);
      }
      if (done === false) {
        onPrompt();
        return rl.prompt();
      } else {
        console.log("debugger exited with code " + done.v);
        return rl.close();
      }
    });
  }
} else {
  console.log("Usage: node -harmony demo/debug [<testName>] <options>\nParameters:\n<testName>: Name of the test. Defined in test/test.yaml\n<options>:\n  -d --debug: use debug mode\n  -i --in: specify stdio input\n  -f --file: specify a cpp file");
}

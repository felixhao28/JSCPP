var JSCPP, code, config, configs, cppFile, exitcode, fs, i, input, j, l, lastOutputPos, len, mydebugger, onPrompt, readline, rl, srcLines, testName, tests,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

JSCPP = require("../lib/main");

fs = require("fs");

config = {};

if (process.argv.length > 2) {
  testName = process.argv[2];
  configs = process.argv.slice(3);
  if (indexOf.call(configs, "-debug") >= 0) {
    config.debug = true;
  }
  if (indexOf.call(configs, "-f") >= 0) {
    code = fs.readFileSync(testName);
    input = "";
  } else {
    tests = JSON.parse(fs.readFileSync("test/test.json"));
    cppFile = tests.tests[testName].cases[0].cpp;
    input = tests.tests[testName].cases[0]["in"] || "";
    code = fs.readFileSync("./test/" + cppFile);
  }
  if (!config.debug) {
    exitcode = JSCPP.run(code, input, config);
    console.info("\nprogram exited with code " + exitcode);
  } else {
    mydebugger = JSCPP.run(code, input, config);
    console.log("Available commands:\nn, next                   : step into\nt, type <name>            : internal details of a type <name>\nv, var, variable          : all local variables\nv, var, variable <name>   : a variable called <name>\nc, current, pos, position : current position in source\n");
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
        console.log(("    " + (line - 1) + ":\t") + srcLines[line - 2]);
      }
      console.log(("==> " + line + ":\t") + srcLines[line - 1]);
      if (line < srcLines.length) {
        return console.log(("    " + (line + 1) + ":\t") + srcLines[line]);
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
  console.log("Usage: node -harmony demo/debug <testName> <options>\nParameters:\n<testName>: Name of the test. Defined in test/test.json\n<options>:\n    -debug: use debug mode");
}

var JSCPP, code, config, configs, cppFile, exitcode, fs, input, lastOutputPos, mydebugger, readline, rl, testName, tests,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

JSCPP = require("../lib/main");

fs = require("fs");

config = {};

mydebugger = new JSCPP.Debugger();

if (process.argv.length > 2) {
  testName = process.argv[2];
  configs = process.argv.slice(3);
  if (indexOf.call(configs, "-debug") >= 0) {
    config.debug = true;
    config["debugger"] = mydebugger;
  }
} else {
  testName = "maze";
}

tests = JSON.parse(fs.readFileSync("test/test.json"));

cppFile = tests.tests[testName].cpp[0];

input = tests.tests[testName].cases[0]["in"];

code = fs.readFileSync("./test/" + cppFile);

exitcode = JSCPP.launcher.run(code, input, config);

console.info("\nprogram exited with code " + exitcode);

if (config.debug) {
  readline = require("readline");
  rl = readline.createInterface(process.stdin, process.stdout);
  rl.setPrompt("\ndebug> ");
  console.log("==>" + mydebugger.nextLine());
  rl.prompt();
  String.prototype.startsWith = function(s) {
    return this.slice(s.length) === s;
  };
  lastOutputPos = 0;
  rl.on("line", function(line) {
    var cmds, e, hasNext, hasPrev, newoutput, s;
    try {
      hasNext = true;
      cmds = line.trim().split(" ");
      switch (cmds[0]) {
        case "n":
          hasNext = mydebugger.next();
          newoutput = mydebugger.output();
          if (newoutput.length > lastOutputPos) {
            console.log("=======output=======");
            console.log(newoutput.slice(lastOutputPos));
            console.log("=======output=======");
            lastOutputPos = newoutput.length;
          }
          break;
        case "p":
          hasPrev = mydebugger.prev();
          break;
        case "t":
          console.log(mydebugger.type(cmds[1]));
          break;
        case "v":
          console.log(mydebugger.variable(cmds[1]));
          break;
        case "c":
          s = mydebugger.nextStmt();
          console.log(s.line + ":" + s.column + "(" + s.pos + ") - " + s.reportedLine + ":" + s.reportedColumn + "(" + s.reportedPos + ")");
      }
    } catch (_error) {
      e = _error;
      console.log("command failed: " + e.stack);
    }
    if (hasNext) {
      console.log("==>" + mydebugger.nextLine());
      return rl.prompt();
    } else {
      return rl.close();
    }
  });
}

var Interpreter, JSCPP, Runtime, ast, code, exitCode, exitValue, fs, includes, input, inputbuffer, interpreter, mainFunc, preprocessor, rt, tree, version;

JSCPP = require("../lib/main");

fs = require("fs");

code = fs.readFileSync("./test/maze.pass.cpp");

input = fs.readFileSync("./test/maze.in");

code = code.toString();

inputbuffer = input.toString();

Runtime = JSCPP.Runtime, preprocessor = JSCPP.preprocessor, Interpreter = JSCPP.Interpreter, ast = JSCPP.ast, includes = JSCPP.includes, version = JSCPP.version;

console.log("Initilizing JSCPP " + version + "...");

rt = new Runtime({
  stdio: {
    drain: function() {
      var x;
      x = inputbuffer;
      inputbuffer = null;
      return x;
    },
    write: function(s) {
      return process.stdout.write(s);
    }
  },
  includes: {
    iostream: includes.iostream,
    "math.h": includes.cmath
  }
});

console.log("JSCPP is ready\n");

console.log("Preprocessing code...");

code = preprocessor.parse(rt, code);

console.log("Preprocessing complete\n");

console.log("Constructing abstract syntax tree...");

tree = ast.parse(code);

console.log("Syntax passed\n");

console.log("Begin execution");

console.log("================");

interpreter = new Interpreter(rt);

interpreter.run(tree);

mainFunc = rt.getFunc("global", "main", []);

exitValue = mainFunc(rt, null, []);

exitCode = exitValue.v;

console.log("================");

console.log("Program exited with code " + exitCode);

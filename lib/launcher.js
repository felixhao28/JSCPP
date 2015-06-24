var CRuntime, Debugger, Interpreter, alias, ast, headerAlias, includes, mergeConfig, preprocessor, realName;

CRuntime = require("./rt");

Interpreter = require("./interpreter");

ast = require("./ast");

preprocessor = require("./preprocessor");

Debugger = require("./debugger");

mergeConfig = function(a, b) {
  var o;
  for (o in b) {
    if (o in a && typeof b[o] === "object") {
      mergeConfig(a[o], b[o]);
    } else {
      a[o] = b[o];
    }
  }
};

includes = {
  iostream: require("./includes/iostream"),
  cctype: require("./includes/cctype"),
  cstring: require("./includes/cstring"),
  cmath: require("./includes/cmath"),
  cstdio: require("./includes/cstdio"),
  cstdlib: require("./includes/cstdlib"),
  iomanip: require("./includes/iomanip")
};

headerAlias = {
  "ctype.h": "cctype",
  "string.h": "cstring",
  "math.h": "cmath",
  "stdio.h": "cstdio",
  "stdlib.h": "cstdlib"
};

for (alias in headerAlias) {
  realName = headerAlias[alias];
  includes[alias] = includes[realName];
}

module.exports = {
  includes: includes,
  run: function(code, input, config) {
    var _config, defGen, inputbuffer, interpreter, mainGen, mydebugger, rt, self, step, tree;
    inputbuffer = input.toString();
    self = this;
    _config = {
      stdio: {
        drain: function() {
          var x;
          x = inputbuffer;
          inputbuffer = null;
          return x;
        },
        write: function(s) {
          process.stdout.write(s);
        }
      },
      includes: self.includes
    };
    mergeConfig(_config, config);
    rt = new CRuntime(_config);
    code = code.toString();
    code = preprocessor.parse(rt, code);
    mydebugger = new Debugger();
    if (_config.debug) {
      mydebugger.src = code;
    }
    tree = ast.parse(code);
    interpreter = new Interpreter(rt);
    defGen = interpreter.run(tree);
    while (true) {
      step = defGen.next();
      if (step.done) {
        break;
      }
    }
    mainGen = rt.getFunc("global", "main", [])(rt, null, []);
    if (_config.debug) {
      mydebugger.start(rt, mainGen);
      return mydebugger;
    } else {
      while (true) {
        step = mainGen.next();
        if (step.done) {
          break;
        }
      }
      return step.value.v;
    }
  }
};

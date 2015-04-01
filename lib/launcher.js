var CRuntime, Interpreter, ast, mergeConfig, preprocessor;

CRuntime = require("./rt");

Interpreter = require("./interpreter");

ast = require("./ast");

preprocessor = require("./preprocessor");

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

module.exports = {
  includes: {
    iostream: require("./includes/iostream"),
    cctype: require("./includes/cctype"),
    cstring: require("./includes/cstring"),
    cmath: require("./includes/cmath"),
    cstdio: require("./includes/cstdio"),
    cstdlib: require("./includes/cstdlib")
  },
  run: function(code, input, config) {
    var _config, exitCode, inputbuffer, interpreter, rt, self, tree;
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
    tree = ast.parse(code);
    interpreter = new Interpreter(rt);
    interpreter.run(tree);
    exitCode = rt.getFunc("global", "main", [])(rt, null, []).v;
    return exitCode;
  }
};

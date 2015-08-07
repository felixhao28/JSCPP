var PEGUtil, Preprocessor, prepast;

prepast = require("./prepast");

PEGUtil = require("pegjs-util");

Preprocessor = function(rt) {
  var pushInc, self;
  pushInc = function(b) {
    self.doinclude.push(self.doinclude[self.doinclude.length - 1] && b);
  };
  this.rt = rt;
  this.ret = "";
  this.macros = {};
  this.macroStack = [];
  this.doinclude = [true];
  self = this;
  this.visitors = {
    TranslationUnit: function(interp, s, code) {
      var dec, i;
      i = 0;
      while (i < s.lines.length) {
        dec = s.lines[i];
        interp.visit(dec, code);
        interp.ret += dec.space;
        i++;
      }
      return interp.ret;
    },
    Code: function(interp, s, code) {
      var i, x;
      if (interp.doinclude[interp.doinclude.length - 1]) {
        i = 0;
        while (i < s.val.length) {
          x = interp.work(s.val[i]);
          interp.ret += x;
          i++;
        }
      }
    },
    PrepSimpleMacro: function(interp, s, code) {
      interp.newMacro(s.Identifier, s.Replacement);
    },
    PrepFunctionMacro: function(interp, s, code) {
      interp.newMacroFunction(s.Identifier, s.Args, s.Replacement);
    },
    PrepIncludeLib: function(interp, s, code) {
      interp.rt.include(s.name);
    },
    PrepIncludeLocal: function(interp, s, code) {
      var includes;
      includes = interp.rt.config.includes;
      if (s.name in includes) {
        includes[s.name].load(interp.rt);
      } else {
        interp.rt.raiseException("cannot find file: " + s.name);
      }
    },
    PrepUndef: function(interp, s, code) {
      if (interp.isMacroDefined(s.Identifier)) {
        delete interp.macros[s.Identifier.val];
      }
    },
    PrepIfdef: function(interp, s, code) {
      pushInc(interp.isMacroDefined(s.Identifier));
    },
    PrepIfndef: function(interp, s, code) {
      pushInc(!interp.isMacroDefined(s.Identifier));
    },
    PrepElse: function(interp, s, code) {
      var x;
      if (interp.doinclude.length > 1) {
        x = interp.doinclude.pop();
        pushInc(!x);
      } else {
        interp.rt.raiseException("#else must be used after a #if");
      }
    },
    PrepEndif: function(interp, s, code) {
      if (interp.doinclude.length > 1) {
        interp.doinclude.pop();
      } else {
        interp.rt.raiseException("#endif must be used after a #if");
      }
    },
    unknown: function(interp, s, code) {
      interp.rt.raiseException("unhandled syntax " + s.type);
    }
  };
};

Preprocessor.prototype.visit = function(s, code) {
  var _node;
  if ("type" in s) {
    _node = this.currentNode;
    this.currentNode = s;
    if (s.type in this.visitors) {
      return this.visitors[s.type](this, s, code);
    } else {
      return this.visitors["unknown"](this, s, code);
    }
    this.currentNode = _node;
  } else {
    this.currentNode = s;
    this.rt.raiseException("untyped syntax structure: " + JSON.stringify(s));
  }
};

Preprocessor.prototype.isMacroDefined = function(node) {
  if (node.type === "Identifier") {
    return node.val in this.macros;
  } else {
    return node.Identifier.val in this.macros;
  }
};

Preprocessor.prototype.isMacro = function(node) {
  return this.isMacroDefined(node) && "val" in node && this.macros[node.val].type === "simple";
};

Preprocessor.prototype.isMacroFunction = function(node) {
  return this.isMacroDefined(node) && "Identifier" in node && this.macros[node.Identifier.val].type === "function";
};

Preprocessor.prototype.newMacro = function(id, replacement) {
  if (this.isMacroDefined(id)) {
    this.rt.raiseException("macro " + id.val + " is already defined");
  }
  this.macros[id.val] = {
    type: "simple",
    replacement: replacement
  };
};

Preprocessor.prototype.newMacroFunction = function(id, args, replacement) {
  if (this.isMacroDefined(id)) {
    this.rt.raiseException("macro " + id.val + " is already defined");
  }
  this.macros[id.val] = {
    type: "function",
    args: args,
    replacement: replacement
  };
};

Preprocessor.prototype.work = function(node) {
  if (node.type === "Seperator") {
    return node.val + node.space;
  } else {
    if (node in this.macroStack) {
      this.rt.raiseException("recursive macro detected");
    }
    this.macroStack.push(node);
    if (node.type === "Identifier") {
      return this.replaceMacro(node) + node.space;
    } else if (node.type === "PrepFunctionMacroCall") {
      return this.replaceMacroFunction(node);
    }
    this.macroStack.pop();
  }
};

Preprocessor.prototype.replaceMacro = function(id) {
  var i, rep, ret, v;
  if (this.isMacro(id)) {
    ret = "";
    rep = this.macros[id.val].replacement;
    i = 0;
    while (i < rep.length) {
      v = this.work(rep[i]);
      ret += v;
      i++;
    }
    return ret;
  } else {
    return id.val;
  }
};

Preprocessor.prototype.replaceMacroFunction = function(node) {
  var argi, args, argsText, i, j, name, rep, ret, v, x;
  if (this.isMacroFunction(node)) {
    name = node.Identifier.val;
    argsText = node.Args;
    rep = this.macros[name].replacement;
    args = this.macros[name].args;
    if (args.length === argsText.length) {
      ret = "";
      i = 0;
      while (i < rep.length) {
        if (rep[i].type === "Seperator") {
          v = this.work(rep[i]);
          ret += v;
        } else {
          argi = -1;
          j = 0;
          while (j < args.length) {
            if (rep[i].type === "Identifier" && args[j].val === rep[i].val) {
              argi = j;
              break;
            }
            j++;
          }
          if (argi >= 0) {
            v = "";
            j = 0;
            while (j < argsText[argi].length) {
              v += this.work(argsText[argi][j]);
              j++;
            }
            ret += v + rep[i].space;
          } else {
            v = this.work(rep[i]);
            ret += v;
          }
        }
        i++;
      }
      return ret;
    } else {
      this.rt.raiseException("macro " + name + " requires " + args.length + " arguments (" + argsText.length + " given)");
    }
  } else {
    argsText = node.Args;
    v = [];
    i = 0;
    while (i < argsText.length) {
      x = "";
      j = 0;
      while (j < argsText[i].length) {
        x += this.work(argsText[i][j]);
        j++;
      }
      v.push(x);
      i++;
    }
    return node.Identifier.val + "(" + v.join(",") + ")" + node.space;
  }
};

Preprocessor.prototype.parse = function(code) {
  var result;
  result = PEGUtil.parse(prepast, code);
  if (result.error != null) {
    throw "ERROR: Preprocessing Failure:\n" + PEGUtil.errorMessage(result.error, true);
  }
  this.rt.interp = this;
  return this.visit(result.ast, code);
};

module.exports = {
  parse: function(rt, code) {
    return new Preprocessor(rt).parse(code);
  }
};

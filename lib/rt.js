var CRuntime, Defaults,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

Defaults = require("./defaults");

CRuntime = function(config) {
  var defaults, mergeConfig;
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
  defaults = new Defaults();
  this.config = defaults.config;
  mergeConfig(this.config, config);
  this.numericTypeOrder = defaults.numericTypeOrder;
  this.types = defaults.types;
  this.intTypeLiteral = this.primitiveType("int");
  this.unsignedintTypeLiteral = this.primitiveType("unsigned int");
  this.longTypeLiteral = this.primitiveType("long");
  this.floatTypeLiteral = this.primitiveType("float");
  this.doubleTypeLiteral = this.primitiveType("double");
  this.charTypeLiteral = this.primitiveType("char");
  this.boolTypeLiteral = this.primitiveType("bool");
  this.voidTypeLiteral = this.primitiveType("void");
  this.nullPointerValue = this.makeNormalPointerValue(null);
  this.voidPointerType = this.normalPointerType(this.voidTypeLiteral);
  this.nullPointer = this.val(this.voidPointerType, this.nullPointerValue);
  this.scope = [
    {
      "$name": "global"
    }
  ];
  return this;
};

CRuntime.prototype.include = function(name) {
  var includes, lib;
  includes = this.config.includes;
  if (name in includes) {
    lib = includes[name];
    if (indexOf.call(this.config.loadedLibraries, name) >= 0) {
      return;
    }
    this.config.loadedLibraries.push(name);
    includes[name].load(this);
  } else {
    this.raiseException("cannot find library: " + name);
  }
};

CRuntime.prototype.getSize = function(element) {
  var i, ret;
  ret = 0;
  if (this.isArrayType(element.t) && element.v.position === 0) {
    i = 0;
    while (i < element.v.target.length) {
      ret += this.getSize(element.v.target[i]);
      i++;
    }
  } else {
    ret += this.getSizeByType(element.t);
  }
  return ret;
};

CRuntime.prototype.getSizeByType = function(type) {
  if (this.isPointerType(type)) {
    return this.config.limits["pointer"].bytes;
  } else if (this.isPrimitiveType(type)) {
    return this.config.limits[type.name].bytes;
  } else {
    this.raiseException("not implemented");
  }
};

CRuntime.prototype.getMember = function(l, r) {
  if (this.isClassType(l.t)) {
    return l.v.members[r];
  } else {
    this.raiseException("only a class can have members");
  }
};

CRuntime.prototype.defFunc = function(lt, name, retType, argTypes, argNames, stmts, interp) {
  var f;
  f = function() {
    var _this, args, ret, rt;
    rt = arguments[0], _this = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    rt.enterScope("function " + name);
    argNames.forEach(function(v, i) {
      rt.defVar(v, argTypes[i], args[i]);
    });
    ret = interp.run(stmts, {
      scope: "function"
    });
    if (!rt.isTypeEqualTo(retType, rt.voidTypeLiteral)) {
      if (ret instanceof Array && ret[0] === "return") {
        ret = rt.cast(retType, ret[1]);
      } else {
        this.raiseException("you must return a value");
      }
    } else {
      if (typeof ret === "Array") {
        if (ret[0] === "return" && ret[1]) {
          this.raiseException("you cannot return a value of a void function");
        }
      }
      ret = void 0;
    }
    rt.exitScope("function " + name);
    return ret;
  };
  this.regFunc(f, lt, name, argTypes, retType);
};

CRuntime.prototype.makeValString = function(l) {
  var display;
  display = l.v;
  if (this.isTypeEqualTo(l.t, this.charTypeLiteral)) {
    display = String.fromCharCode(l.v);
  }
  return display + "(" + this.makeTypeString(l.t) + ")";
};

CRuntime.prototype.makeParametersSigniture = function(args) {
  var i, ret;
  ret = new Array(args.length);
  i = 0;
  while (i < args.length) {
    ret[i] = this.getTypeSigniture(args[i]);
    i++;
  }
  return ret.join(",");
};

CRuntime.prototype.getCompatibleFunc = function(lt, name, args) {
  var argsStr, compatibles, ltsig, rt, sig, t, ts;
  ltsig = this.getTypeSigniture(lt);
  if (ltsig in this.types) {
    t = this.types[ltsig];
    if (name in t) {
      ts = args.map(function(v) {
        return v.t;
      });
      sig = this.makeParametersSigniture(ts);
      if (sig in t[name]) {
        return t[name][sig];
      } else {
        compatibles = [];
        rt = this;
        t[name]["reg"].forEach(function(dts) {
          var i, newTs, ok;
          if (dts[dts.length - 1] === "?" && dts.length < ts.length) {
            newTs = ts.slice(0, dts.length - 1);
            dts = dts.slice(0, -1);
          } else {
            newTs = ts;
          }
          if (dts.length === newTs.length) {
            ok = true;
            i = 0;
            while (ok && i < newTs.length) {
              ok = rt.castable(newTs[i], dts[i]);
              i++;
            }
            if (ok) {
              compatibles.push(t[name][rt.makeParametersSigniture(dts)]);
            }
          }
        });
        if (compatibles.length === 0) {
          if ("#default" in t[name]) {
            return t[name]["#default"];
          }
          rt = this;
          argsStr = ts.map(function(v) {
            return rt.makeTypeString(v);
          }).join(",");
          this.raiseException("no method " + name + " in " + lt + " accepts " + argsStr);
        } else if (compatibles.length > 1) {
          this.raiseException("ambiguous method invoking, " + compatibles.length + "compatible methods");
        } else {
          return compatibles[0];
        }
      }
    } else {
      this.raiseException("method " + name + " is not defined in " + this.makeTypeString(lt));
    }
  } else {
    this.raiseException("type " + this.makeTypeString(lt) + " is unknown");
  }
};

CRuntime.prototype.matchVarArg = function(methods, sig) {
  var _sig;
  for (_sig in methods) {
    if (_sig[_sig.length - 1] === "?") {
      _sig = _sig.slice(0, -1);
      if (sig.startsWith(_sig)) {
        return methods[_sig];
      }
    }
  }
  return null;
};

CRuntime.prototype.getFunc = function(lt, name, args) {
  var f, ltsig, method, sig, t;
  method = void 0;
  if (this.isPointerType(lt)) {
    f = void 0;
    if (this.isArrayType(lt)) {
      f = "pointer_array";
    } else if (this.isFunctionType(lt)) {
      f = "pointer_function";
    } else {
      f = "pointer_normal";
    }
    t = null;
    if (name in this.types[f]) {
      t = this.types[f];
    } else if (name in this.types["pointer"]) {
      t = this.types["pointer"];
    }
    if (t) {
      sig = this.makeParametersSigniture(args);
      if (sig in t[name]) {
        return t[name][sig];
      } else if ((method = this.matchVarArg(t[name], sig)) !== null) {
        return method;
      } else if ("#default" in t[name]) {
        return t[name]["#default"];
      } else {
        this.raiseException("no method " + name + " in " + this.makeTypeString(lt) + " accepts (" + sig + ")");
      }
    }
  }
  ltsig = this.getTypeSigniture(lt);
  if (ltsig in this.types) {
    t = this.types[ltsig];
    if (name in t) {
      sig = this.makeParametersSigniture(args);
      if (sig in t[name]) {
        return t[name][sig];
      } else if ((method = this.matchVarArg(t[name], sig)) !== null) {
        return method;
      } else if ("#default" in t[name]) {
        return t[name]["#default"];
      } else {
        this.raiseException("no method " + name + " in " + this.makeTypeString(lt) + " accepts (" + sig + ")");
      }
    } else {
      this.raiseException("method " + name + " is not defined in " + this.makeTypeString(lt));
    }
  } else {
    if (this.isPointerType(lt)) {
      this.raiseException("this pointer has no proper method overload");
    } else {
      this.raiseException("type " + this.makeTypeString(lt) + " is not defined");
    }
  }
};

CRuntime.prototype.regFunc = function(f, lt, name, args, retType) {
  var ltsig, sig, t, type;
  ltsig = this.getTypeSigniture(lt);
  if (ltsig in this.types) {
    t = this.types[ltsig];
    if (!(name in t)) {
      t[name] = {};
    }
    if (!("reg" in t[name])) {
      t[name]["reg"] = [];
    }
    sig = this.makeParametersSigniture(args);
    if (sig in t[name]) {
      this.raiseException("method " + name + " with parameters (" + sig + ") is already defined");
    }
    type = this.functionPointerType(retType, args);
    if (lt === "global") {
      this.defVar(name, type, this.val(type, this.makeFunctionPointerValue(f, name, lt, args, retType)));
    }
    t[name][sig] = f;
    t[name]["reg"].push(args);
  } else {
    this.raiseException("type " + this.makeTypeString(lt) + " is unknown");
  }
};

CRuntime.prototype.promoteNumeric = function(l, r) {
  var rett, slt, slti, srt, srti;
  if (!this.isNumericType(l) || !this.isNumericType(r)) {
    this.raiseException("you cannot promote (to) a non numeric type");
  }
  if (this.isTypeEqualTo(l, r)) {
    return l;
  } else if (this.isIntegerType(l) && this.isIntegerType(r)) {
    slt = this.getSignedType(l);
    srt = this.getSignedType(r);
    slti = this.numericTypeOrder.indexOf(slt.name);
    srti = this.numericTypeOrder.indexOf(srt.name);
    if (slti <= srti) {
      if (this.isUnsignedType(l) && this.isUnsignedType(r)) {
        rett = r;
      } else {
        rett = srt;
      }
    } else {
      if (this.isUnsignedType(l) && this.isUnsignedType(r)) {
        rett = l;
      } else {
        rett = slt;
      }
    }
    return rett;
  } else if (!this.isIntegerType(l) && this.isIntegerType(r)) {
    return l;
  } else if (this.isIntegerType(l) && !this.isIntegerType(r)) {
    return r;
  } else if (!this.isIntegerType(l) && !this.isIntegerType(r)) {
    return this.primitiveType("double");
  }
};

CRuntime.prototype.readVar = function(varname) {
  var i, vc;
  i = this.scope.length - 1;
  while (i >= 0) {
    vc = this.scope[i];
    if (vc[varname]) {
      return vc[varname];
    }
    i--;
  }
  this.raiseException("variable " + varname + " does not exist");
};

CRuntime.prototype.defVar = function(varname, type, initval) {
  var vc;
  vc = this.scope[this.scope.length - 1];
  if (varname in vc) {
    this.raiseException("variable " + varname + " already defined");
  }
  initval = this.clone(this.cast(type, initval));
  if (initval === void 0) {
    vc[varname] = this.defaultValue(type);
    vc[varname].left = true;
  } else {
    vc[varname] = initval;
    vc[varname].left = true;
  }
};

CRuntime.prototype.inrange = function(type, value) {
  var limit;
  if (this.isPrimitiveType(type)) {
    limit = this.config.limits[type.name];
    return value <= limit.max && value >= limit.min;
  }
  return true;
};

CRuntime.prototype.isNumericType = function(type) {
  return this.isFloatType(type) || this.isIntegerType(type);
};

CRuntime.prototype.isUnsignedType = function(type) {
  if (typeof type === "string") {
    switch (type) {
      case "unsigned char":
      case "unsigned short":
      case "unsigned short int":
      case "unsigned":
      case "unsigned int":
      case "unsigned long":
      case "unsigned long int":
      case "unsigned long long":
      case "unsigned long long int":
        return true;
      default:
        return false;
    }
  } else {
    return type.type === "primitive" && this.isUnsignedType(type.name);
  }
};

CRuntime.prototype.isIntegerType = function(type) {
  if (typeof type === "string") {
    switch (type) {
      case "char":
      case "signed char":
      case "unsigned char":
      case "short":
      case "short int":
      case "signed short":
      case "signed short int":
      case "unsigned short":
      case "unsigned short int":
      case "int":
      case "signed int":
      case "unsigned":
      case "unsigned int":
      case "long":
      case "long int":
      case "long int":
      case "signed long":
      case "signed long int":
      case "unsigned long":
      case "unsigned long int":
      case "long long":
      case "long long int":
      case "long long int":
      case "signed long long":
      case "signed long long int":
      case "unsigned long long":
      case "unsigned long long int":
        return true;
      default:
        return false;
    }
  } else {
    return type.type === "primitive" && this.isIntegerType(type.name);
  }
};

CRuntime.prototype.isFloatType = function(type) {
  if (typeof type === "string") {
    switch (type) {
      case "float":
      case "double":
        return true;
      default:
        return false;
    }
  } else {
    return type.type === "primitive" && this.isFloatType(type.name);
  }
};

CRuntime.prototype.getSignedType = function(type) {
  if (type !== "unsigned") {
    return this.primitiveType(type.name.substring("unsigned".length).trim());
  } else {
    return this.primitiveType("int");
  }
};

CRuntime.prototype.castable = function(type1, type2) {
  if (this.isTypeEqualTo(type1, type2)) {
    return true;
  }
  if (this.isPrimitiveType(type1) && this.isPrimitiveType(type2)) {
    return this.isNumericType(type2) || !this.isNumericType(type1);
  } else if (this.isPointerType(type1) && this.isPointerType(type2)) {
    if (this.isFunctionType(type1)) {
      return this.isPointerType(type2);
    }
    return !this.isFunctionType(type2);
  } else if (this.isClassType(type1) || this.isClassType(type2)) {
    this.raiseException("not implemented");
  }
  return false;
};

CRuntime.prototype.cast = function(type, value) {
  var v;
  if (this.isTypeEqualTo(value.t, type)) {
    return value;
  }
  if (this.isPrimitiveType(type) && this.isPrimitiveType(value.t)) {
    if (type.name === "bool") {
      return this.val(type, value.v ? true : false);
    } else if (type.name in ["float", "double"]) {
      if (!this.isNumericType(value.t)) {
        this.raiseException("cannot cast " + this.makeTypeString(value.t) + " to " + this.makeTypeString(type));
      }
      if (this.inrange(type, value.v)) {
        return this.val(type, value.v);
      } else {
        this.raiseException("overflow when casting " + this.makeTypeString(value.t) + " to " + this.makeTypeString(type));
      }
    } else {
      if (type.name.slice(0, 8) === "unsigned") {
        if (!this.isNumericType(value.t)) {
          this.raiseException("cannot cast " + this.makeTypeString(value.t) + " to " + this.makeTypeString(type));
        } else if (value.v < 0) {
          this.raiseException("cannot cast negative value to " + this.makeTypeString(type));
        }
      }
      if (!this.isNumericType(value.t)) {
        this.raiseException("cannot cast " + this.makeTypeString(value.t) + " to " + this.makeTypeString(type));
      }
      if (value.t.name === "float" || value.t.name === "double") {
        v = value.v > 0 ? Math.floor(value.v) : Math.ceil(value.v);
        if (this.inrange(type, v)) {
          return this.val(type, v);
        } else {
          this.raiseException("overflow when casting " + value.v + "(" + this.makeTypeString(value.t) + ") to " + this.makeTypeString(type));
        }
      } else {
        if (this.inrange(type, value.v)) {
          return this.val(type, value.v);
        } else {
          this.raiseException("overflow when casting " + value.v + "(" + this.makeTypeString(value.t) + ") to " + this.makeTypeString(type));
        }
      }
    }
  } else if (this.isPointerType(type)) {
    if (this.isFunctionType(type)) {
      if (this.isFunctionType(value.t)) {
        return this.val(value.t, value.v);
      } else {
        this.raiseException("cannot cast a regular pointer to a function");
      }
    } else if (this.isArrayType(value.t)) {
      if (this.isNormalPointerType(type)) {
        if (this.isTypeEqualTo(type.targetType, value.t.eleType)) {
          return value;
        } else {
          this.raiseException(this.makeTypeString(type.targetType) + " is not equal to array element type " + this.makeTypeString(value.t.eleType));
        }
      } else if (this.isArrayType(type)) {
        if (this.isTypeEqualTo(type.eleType, value.t.eleType)) {
          return value;
        } else {
          this.raiseException("array element type " + this.makeTypeString(type.eleType) + " is not equal to array element type " + this.makeTypeString(value.t.eleType));
        }
      } else {
        this.raiseException("cannot cast a function to a regular pointer");
      }
    } else {
      if (this.isNormalPointerType(type)) {
        if (this.isTypeEqualTo(type.targetType, value.t.targetType)) {
          return value;
        } else {
          this.raiseException(this.makeTypeString(type.targetType) + " is not equal to " + this.makeTypeString(value.t.eleType));
        }
      } else if (this.isArrayType(type)) {
        if (this.isTypeEqualTo(type.eleType, value.t.targetType)) {
          return value;
        } else {
          this.raiseException("array element type " + this.makeTypeString(type.eleType) + " is not equal to " + this.makeTypeString(value.t.eleType));
        }
      } else {
        this.raiseException("cannot cast a function to a regular pointer");
      }
    }
  } else if (this.isClassType(type)) {
    this.raiseException("not implemented");
  } else if (this.isClassType(value.t)) {
    if (this.isTypeEqualTo(this.boolTypeLiteral, type)) {
      return this.val(this.boolTypeLiteral, true);
    } else {
      this.raiseException("not implemented");
    }
  } else {
    this.raiseException("cast failed from type " + this.makeTypeString(type) + " to " + this.makeTypeString(value.t));
  }
};

CRuntime.prototype.clone = function(v) {
  return this.val(v.t, v.v);
};

CRuntime.prototype.enterScope = function(scopename) {
  this.scope.push({
    "$name": scopename
  });
};

CRuntime.prototype.exitScope = function(scopename) {
  var s;
  while (true) {
    s = this.scope.pop();
    if (!(scopename && this.scope.length > 1 && s["$name"] !== scopename)) {
      break;
    }
  }
};

CRuntime.prototype.val = function(type, v, left) {
  if (this.isNumericType(type) && !this.inrange(type, v)) {
    this.raiseException("overflow of " + this.makeValString({
      t: type,
      v: v
    }));
  }
  if (left === void 0) {
    left = false;
  }
  return {
    "t": type,
    "v": v,
    "left": left
  };
};

CRuntime.prototype.isTypeEqualTo = function(type1, type2) {
  var _this;
  if (type1.type === type2.type) {
    switch (type1.type) {
      case "primitive":
      case "class":
        return type1.name === type2.name;
      case "pointer":
        if (type1.ptrType === type2.ptrType || type1.ptrType !== "function" && type2.ptrType !== "function") {
          switch (type1.ptrType) {
            case "array":
              return this.isTypeEqualTo(type1.eleType, type2.eleType || type2.targetType);
            case "function":
              if (this.isTypeEqualTo(type1.retType, type2.retType) && type1.sigiture.length === type2.sigiture.length) {
                _this = this;
                return type1.sigiture.every(function(type, index, arr) {
                  return _this.isTypeEqualTo(type, type2.sigiture[index]);
                });
              }
              break;
            case "normal":
              return this.isTypeEqualTo(type1.targetType, type2.eleType || type2.targetType);
          }
        }
    }
  }
  return false;
};

CRuntime.prototype.isBoolType = function(type) {
  if (typeof type === "string") {
    return type === "bool";
  } else {
    return type.type === "primitive" && this.isBoolType(type.name);
  }
};

CRuntime.prototype.isPrimitiveType = function(type) {
  return this.isNumericType(type) || this.isBoolType(type);
};

CRuntime.prototype.isArrayType = function(type) {
  return this.isPointerType(type) && type.ptrType === "array";
};

CRuntime.prototype.isFunctionType = function(type) {
  return this.isPointerType(type) && type.ptrType === "function";
};

CRuntime.prototype.isNormalPointerType = function(type) {
  return this.isPointerType(type) && type.ptrType === "normal";
};

CRuntime.prototype.isPointerType = function(type) {
  return type.type === "pointer";
};

CRuntime.prototype.isClassType = function(type) {
  return type.type === "class";
};

CRuntime.prototype.arrayPointerType = function(eleType, size) {
  return {
    type: "pointer",
    ptrType: "array",
    eleType: eleType,
    size: size
  };
};

CRuntime.prototype.makeArrayPointerValue = function(arr, position) {
  return {
    target: arr,
    position: position
  };
};

CRuntime.prototype.functionPointerType = function(retType, sigiture) {
  return {
    type: "pointer",
    ptrType: "function",
    retType: retType,
    sigiture: sigiture
  };
};

CRuntime.prototype.makeFunctionPointerValue = function(f, name, lt, args, retType) {
  return {
    target: f,
    name: name,
    defineType: lt,
    args: args,
    retType: retType
  };
};

CRuntime.prototype.normalPointerType = function(targetType) {
  return {
    type: "pointer",
    ptrType: "normal",
    targetType: targetType
  };
};

CRuntime.prototype.makeNormalPointerValue = function(target) {
  return {
    target: target
  };
};

CRuntime.prototype.simpleType = function(type) {
  var clsType;
  if (this.isPrimitiveType(type)) {
    return this.primitiveType(type);
  } else {
    clsType = {
      type: "class",
      name: type
    };
    if (this.getTypeSigniture(clsType) in this.types) {
      return clsType;
    } else {
      this.raiseException("type " + this.makeTypeString(type) + " is not defined");
    }
  }
};

CRuntime.prototype.newClass = function(classname, members) {
  var clsType, sig;
  clsType = {
    type: "class",
    name: classname
  };
  sig = this.getTypeSigniture(clsType);
  if (sig in this.types) {
    this.raiseException(this.makeTypeString(clsType) + " is already defined");
  }
  this.types[sig] = {
    "#constructor": function(rt, _this, initMembers) {
      var i, member;
      _this.v.members = {};
      i = 0;
      while (i < members.length) {
        member = members[i];
        _this.v.members[member.name] = initMembers[member.name];
        i++;
      }
    }
  };
  return clsType;
};

CRuntime.prototype.primitiveType = function(type) {
  return {
    type: "primitive",
    name: type
  };
};

CRuntime.prototype.isStringType = function(type) {
  return this.isArrayType(type) && this.isTypeEqualTo(type.eleType, this.charTypeLiteral);
};

CRuntime.prototype.getStringFromCharArray = function(element) {
  var charVal, i, result, target;
  if (this.isStringType(element.t)) {
    target = element.v.target;
    result = "";
    i = 0;
    while (i < target.length) {
      charVal = this.cast(this.charTypeLiteral, target[i]);
      if (charVal.v === 0) {
        break;
      }
      result += String.fromCharCode(charVal.v);
      i++;
    }
    return result;
  } else {
    this.raiseException("target is not a string");
  }
};

CRuntime.prototype.makeCharArrayFromString = function(str) {
  var self, trailingZero, type;
  self = this;
  type = this.arrayPointerType(this.charTypeLiteral, str.length + 1);
  trailingZero = this.val(this.charTypeLiteral, 0);
  return this.val(type, {
    target: str.split("").map(function(c) {
      return self.val(self.charTypeLiteral, c.charCodeAt(0));
    }).concat([trailingZero]),
    position: 0
  });
};

CRuntime.prototype.getTypeSigniture = function(type) {
  var ret, self;
  ret = type;
  self = this;
  if (type.type === "primitive") {
    ret = "(" + type.name + ")";
  } else if (type.type === "class") {
    ret = "[" + type.name + "]";
  } else if (type.type === "pointer") {
    ret = "{";
    if (type.ptrType === "normal") {
      ret += "!" + this.getTypeSigniture(type.targetType);
    } else if (type.ptrType === "array") {
      ret += "!" + this.getTypeSigniture(type.eleType);
    } else if (type.ptrType === "function") {
      ret += "#" + this.getTypeSigniture(type.retType) + "!" + type.sigiture.map(function(e) {
        return this.getTypeSigniture(e);
      }).join(",");
    }
    ret += "}";
  }
  return ret;
};

CRuntime.prototype.makeTypeString = function(type) {
  var ret;
  ret = "$" + type;
  if (type.type === "primitive") {
    ret = type.name;
  } else if (type.type === "class") {
    ret = type.name;
  } else if (type.type === "pointer") {
    ret = "";
    if (type.ptrType === "normal") {
      ret += this.makeTypeString(type.targetType) + "*";
    } else if (type.ptrType === "array") {
      ret += this.makeTypeString(type.eleType) + "*";
    } else if (type.ptrType === "function") {
      ret += this.makeTypeString(type.retType) + "(" + type.sigiture.map(function(e) {
        return this.makeTypeString(e);
      }).join(",") + ")";
    }
  }
  return ret;
};

CRuntime.prototype.defaultValue = function(type) {
  if (type.type === "primitive") {
    if (this.isNumericType(type)) {
      return this.val(type, 0);
    } else if (type.name === "bool") {
      return this.val(type, false);
    }
  } else if (type.type === "class") {
    this.raiseException("no default value for object");
  } else if (type.type === "pointer") {
    if (type.ptrType === "normal") {
      return this.val(type, this.nullPointerValue);
    } else if (type.ptrType === "array") {
      return this.val(type, this.makeArrayPointerValue(null, 0));
    } else if (type.ptrType === "function") {
      return this.val(type, this.makeFunctionPointerValue(null, null, null, null, null));
    }
  }
};

CRuntime.prototype.raiseException = function(message) {
  var col, interp, ln;
  interp = this.interp;
  if (interp) {
    ln = interp.currentNode.line;
    col = interp.currentNode.column;
    throw ln + ":" + col + " " + message;
  } else {
    throw message;
  }
};

module.exports = CRuntime;

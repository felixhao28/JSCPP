var slice = [].slice;

module.exports = function() {
  var defaultOpHandler, defaults;
  defaults = this;
  this.config = {
    specifiers: ["const", "inline", "_stdcall", "extern", "static", "auto", "register"],
    charTypes: ["char", "signed char", "unsigned char", "wchar_t", "unsigned wchar_t", "char16_t", "unsigned char16_t", "char32_t", "unsigned char32_t"],
    intTypes: ["short", "short int", "signed short", "signed short int", "unsigned short", "unsigned short int", "int", "signed int", "unsigned", "unsigned int", "long", "long int", "long int", "signed long", "signed long int", "unsigned long", "unsigned long int", "long long", "long long int", "long long int", "signed long long", "signed long long int", "unsigned long long", "unsigned long long int", "bool"],
    limits: {
      "char": {
        max: 0x7f,
        min: 0x00,
        bytes: 1
      },
      "signed char": {
        max: 0x7f,
        min: -0x80,
        bytes: 1
      },
      "unsigned char": {
        max: 0xff,
        min: 0x00,
        bytes: 1
      },
      "wchar_t": {
        max: 0x7fffffff,
        min: -0x80000000,
        bytes: 4
      },
      "unsigned wchar_t": {
        max: 0xffffffff,
        min: 0x00000000,
        bytes: 4
      },
      "char16_t": {
        max: 0x7fff,
        min: -0x8000,
        bytes: 4
      },
      "unsigned char16_t": {
        max: 0xffff,
        min: 0x0000,
        bytes: 4
      },
      "char32_t": {
        max: 0x7fffffff,
        min: -0x80000000,
        bytes: 4
      },
      "unsigned char32_t": {
        max: 0xffffffff,
        min: 0x00000000,
        bytes: 4
      },
      "short": {
        max: 0x7fff,
        min: -0x8000,
        bytes: 2
      },
      "unsigned short": {
        max: 0xffff,
        min: 0x0000,
        bytes: 2
      },
      "int": {
        max: 0x7fffffff,
        min: -0x80000000,
        bytes: 4
      },
      "unsigned": {
        max: 0xffffffff,
        min: 0x00000000,
        bytes: 4
      },
      "long": {
        max: 0x7fffffff,
        min: -0x80000000,
        bytes: 4
      },
      "unsigned long": {
        max: 0xffffffff,
        min: 0x00000000,
        bytes: 4
      },
      "long long": {
        max: 0x7fffffffffffffff,
        min: -0x8000000000000000,
        bytes: 8
      },
      "unsigned long long": {
        max: 0xffffffffffffffff,
        min: 0x0000000000000000,
        bytes: 8
      },
      "float": {
        max: 3.40282346638529e+038,
        min: -3.40282346638529e+038,
        bytes: 4
      },
      "double": {
        max: 1.79769313486232e+308,
        min: -1.79769313486232e+308,
        bytes: 8
      },
      "pointer": {
        max: void 0,
        min: void 0,
        bytes: 4
      },
      "bool": {
        max: 1,
        min: 0,
        bytes: 1
      }
    },
    loadedLibraries: []
  };
  this.config.limits["short int"] = this.config.limits["short"];
  this.config.limits["signed short"] = this.config.limits["short"];
  this.config.limits["signed short int"] = this.config.limits["short"];
  this.config.limits["unsigned short int"] = this.config.limits["unsigned short"];
  this.config.limits["signed int"] = this.config.limits["int"];
  this.config.limits["unsigned int"] = this.config.limits["unsigned"];
  this.config.limits["long int"] = this.config.limits["long"];
  this.config.limits["long int"] = this.config.limits["long"];
  this.config.limits["signed long"] = this.config.limits["long"];
  this.config.limits["signed long int"] = this.config.limits["long"];
  this.config.limits["unsigned long int"] = this.config.limits["unsigned long"];
  this.config.limits["long long int"] = this.config.limits["long long"];
  this.config.limits["long long int"] = this.config.limits["long long"];
  this.config.limits["signed long long"] = this.config.limits["long long"];
  this.config.limits["signed long long int"] = this.config.limits["long long"];
  this.config.limits["unsigned long long int"] = this.config.limits["unsigned long long"];
  this.numericTypeOrder = ["char", "signed char", "short", "short int", "signed short", "signed short int", "int", "signed int", "long", "long int", "long int", "signed long", "signed long int", "long long", "long long int", "long long int", "signed long long", "signed long long int", "float", "double"];
  defaultOpHandler = {
    "o(*)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support * on " + rt.makeTypeString(r.t));
        }
        ret = l.v * r.v;
        rett = rt.promoteNumeric(l.t, r.t);
        return rt.val(rett, ret);
      }
    },
    "o(/)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support / on " + rt.makeTypeString(r.t));
        }
        ret = l.v / r.v;
        if (rt.isIntegerType(l.t) && rt.isIntegerType(r.t)) {
          ret = Math.floor(ret);
        }
        rett = rt.promoteNumeric(l.t, r.t);
        return rt.val(rett, ret);
      }
    },
    "o(%)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support % on " + rt.makeTypeString(r.t));
        }
        ret = l.v % r.v;
        rett = rt.promoteNumeric(l.t, r.t);
        return rt.val(rett, ret);
      }
    },
    "o(+)": {
      "#default": function(rt, l, r) {
        var i, ret, rett;
        if (r === void 0) {
          return l;
        } else {
          if (!rt.isNumericType(r.t)) {
            rt.raiseException(rt.makeTypeString(l.t) + " does not support + on " + rt.makeTypeString(r.t));
          }
          if (rt.isArrayType(r.t)) {
            i = rt.cast(rt.intTypeLiteral, l).v;
            return rt.val(r.t, rt.makeArrayPointerValue(r.v.target, r.v.position + i));
          } else {
            ret = l.v + r.v;
            rett = rt.promoteNumeric(l.t, r.t);
            return rt.val(rett, ret);
          }
        }
      }
    },
    "o(-)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (r === void 0) {
          rett = l.v > 0 ? rt.getSignedType(l.t) : l.t;
          return rt.val(rett, -l.v);
        } else {
          if (!rt.isNumericType(r.t)) {
            rt.raiseException(rt.makeTypeString(l.t) + " does not support - on " + rt.makeTypeString(r.t));
          }
          ret = l.v - r.v;
          rett = rt.promoteNumeric(l.t, r.t);
          return rt.val(rett, ret);
        }
      }
    },
    "o(<<)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support << on " + rt.makeTypeString(r.t));
        }
        ret = l.v << r.v;
        rett = l.t;
        return rt.val(rett, ret);
      }
    },
    "o(>>)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support >> on " + rt.makeTypeString(r.t));
        }
        ret = l.v >> r.v;
        rett = l.t;
        return rt.val(rett, ret);
      }
    },
    "o(<)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support < on " + rt.makeTypeString(r.t));
        }
        ret = l.v < r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(<=)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support <= on " + rt.makeTypeString(r.t));
        }
        ret = l.v <= r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(>)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support > on " + rt.makeTypeString(r.t));
        }
        ret = l.v > r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(>=)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support >= on " + rt.makeTypeString(r.t));
        }
        ret = l.v >= r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(==)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support == on " + rt.makeTypeString(r.t));
        }
        ret = l.v === r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(!=)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support != on " + rt.makeTypeString(r.t));
        }
        ret = l.v !== r.v;
        rett = rt.boolTypeLiteral;
        return rt.val(rett, ret);
      }
    },
    "o(&)": {
      "#default": function(rt, l, r) {
        var ret, rett, t;
        if (r === void 0) {
          if (l.array) {
            return rt.val(rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex));
          } else {
            t = rt.normalPointerType(l.t);
            return rt.val(t, rt.makeNormalPointerValue(l));
          }
        } else {
          if (!rt.isIntegerType(l.t) || !rt.isNumericType(r.t) || !rt.isIntegerType(r.t)) {
            rt.raiseException(rt.makeTypeString(l.t) + " does not support & on " + rt.makeTypeString(r.t));
          }
          ret = l.v & r.v;
          rett = rt.promoteNumeric(l.t, r.t);
          return rt.val(rett, ret);
        }
      }
    },
    "o(^)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support ^ on " + rt.makeTypeString(r.t));
        }
        ret = l.v ^ r.v;
        rett = rt.promoteNumeric(l.t, r.t);
        return rt.val(rett, ret);
      }
    },
    "o(|)": {
      "#default": function(rt, l, r) {
        var ret, rett;
        if (!rt.isNumericType(r.t) || !rt.isIntegerType(l.t) || !rt.isIntegerType(r.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support | on " + rt.makeTypeString(r.t));
        }
        ret = l.v | r.v;
        rett = rt.promoteNumeric(l.t, r.t);
        return rt.val(rett, ret);
      }
    },
    "o(,)": {
      "#default": function(rt, l, r) {
        return r;
      }
    },
    "o(=)": {
      "#default": function(rt, l, r) {
        if (l.left) {
          l.v = rt.cast(l.t, r).v;
          return l;
        } else {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
      }
    },
    "o(+=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(+)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(-=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(-)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(*=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(*)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(/=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(/)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(%=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(%)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(<<=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(<<)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(>>=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(>>)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(&=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(&)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(^=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(^)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(|=)": {
      "#default": function(rt, l, r) {
        r = defaultOpHandler["o(|)"]["#default"](rt, l, r);
        return defaultOpHandler["o(=)"]["#default"](rt, l, r);
      }
    },
    "o(++)": {
      "#default": function(rt, l, dummy) {
        var b;
        if (!rt.isNumericType(l.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support increment");
        }
        if (!l.left) {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
        if (dummy) {
          b = l.v;
          l.v = l.v + 1;
          if (rt.inrange(l.t, l.v)) {
            return rt.val(l.t, b);
          }
          rt.raiseException("overflow during post-increment " + (rt.makeValString(l)));
        } else {
          l.v = l.v + 1;
          if (rt.inrange(l.t, l.v)) {
            return l;
          }
          rt.raiseException("overflow during pre-increment " + (rt.makeValString(l)));
        }
      }
    },
    "o(--)": {
      "#default": function(rt, l, dummy) {
        var b;
        if (!rt.isNumericType(l.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support decrement");
        }
        if (!l.left) {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
        if (dummy) {
          b = l.v;
          l.v = l.v - 1;
          if (rt.inrange(l.t, l.v)) {
            return rt.val(l.t, b);
          }
          rt.raiseException("overflow during post-decrement");
        } else {
          l.v = l.v - 1;
          b = l.v;
          if (rt.inrange(l.t, l.v)) {
            return l;
          }
          rt.raiseException("overflow during pre-decrement");
        }
      }
    },
    "o(~)": {
      "#default": function(rt, l, dummy) {
        var ret, rett;
        if (!rt.isIntegerType(l.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support ~ on itself");
        }
        ret = ~l.v;
        rett = rt.promoteNumeric(l.t, rt.intTypeLiteral);
        return rt.val(rett, ret);
      }
    },
    "o(!)": {
      "#default": function(rt, l, dummy) {
        var ret, rett;
        if (!rt.isIntegerType(l.t)) {
          rt.raiseException(rt.makeTypeString(l.t) + " does not support ! on itself");
        }
        ret = l.v ? 0 : 1;
        rett = l.t;
        return rt.val(rett, ret);
      }
    }
  };
  this.types = {
    "global": {}
  };
  this.types["(char)"] = defaultOpHandler;
  this.types["(signed char)"] = defaultOpHandler;
  this.types["(unsigned char)"] = defaultOpHandler;
  this.types["(short)"] = defaultOpHandler;
  this.types["(short int)"] = defaultOpHandler;
  this.types["(signed short)"] = defaultOpHandler;
  this.types["(signed short int)"] = defaultOpHandler;
  this.types["(unsigned short)"] = defaultOpHandler;
  this.types["(unsigned short int)"] = defaultOpHandler;
  this.types["(int)"] = defaultOpHandler;
  this.types["(signed int)"] = defaultOpHandler;
  this.types["(unsigned)"] = defaultOpHandler;
  this.types["(unsigned int)"] = defaultOpHandler;
  this.types["(long)"] = defaultOpHandler;
  this.types["(long int)"] = defaultOpHandler;
  this.types["(long int)"] = defaultOpHandler;
  this.types["(signed long)"] = defaultOpHandler;
  this.types["(signed long int)"] = defaultOpHandler;
  this.types["(unsigned long)"] = defaultOpHandler;
  this.types["(unsigned long int)"] = defaultOpHandler;
  this.types["(long long)"] = defaultOpHandler;
  this.types["(long long int)"] = defaultOpHandler;
  this.types["(long long int)"] = defaultOpHandler;
  this.types["(signed long long)"] = defaultOpHandler;
  this.types["(signed long long int)"] = defaultOpHandler;
  this.types["(unsigned long long)"] = defaultOpHandler;
  this.types["(unsigned long long int)"] = defaultOpHandler;
  this.types["(float)"] = defaultOpHandler;
  this.types["(double)"] = defaultOpHandler;
  this.types["(bool)"] = defaultOpHandler;
  this.types["pointer"] = {
    "o(==)": {
      "#default": function(rt, l, r) {
        if (rt.isTypeEqualTo(l.t, r.t)) {
          if (l.t.ptrType === "array") {
            return l.v.target === r.v.target && (l.v.target === null || l.v.position === r.v.position);
          } else {
            return l.v.target === r.v.target;
          }
        }
        return false;
      }
    },
    "o(!=)": {
      "#default": function(rt, l, r) {
        return !rt.types["pointer"]["=="]["#default"](rt, l, r);
      }
    },
    "o(,)": {
      "#default": function(rt, l, r) {
        return r;
      }
    },
    "o(=)": {
      "#default": function(rt, l, r) {
        var t;
        if (!l.left) {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
        t = rt.cast(l.t, r);
        l.t = t.t;
        l.v = t.v;
        return l;
      }
    },
    "o(&)": {
      "#default": function(rt, l, r) {
        var t;
        if (r === void 0) {
          if (l.array) {
            return rt.val(rt.arrayPointerType(l.t, l.array.length), rt.makeArrayPointerValue(l.array, l.arrayIndex));
          } else {
            t = rt.normalPointerType(l.t);
            return rt.val(t, rt.makeNormalPointerValue(l));
          }
        } else {
          rt.raiseException("you cannot cast bitwise and on pointer");
        }
      }
    },
    "o(())": {
      "#default": function(rt, l, bindThis, args) {
        if (!rt.isFunctionType(l.v.target)) {
          rt.raiseException("pointer target(" + (rt.makeValueString(l.v.target)) + ") is not a function");
        }
        return rt.types["function"]["o(())"]["default"](rt, l.v.target, bindThis, args);
      }
    }
  };
  this.types["function"] = {
    "o(())": {
      "#default": function(rt, l, bindThis, args) {
        if (l.t.type === "pointer" && l.t.targetType.type === "function") {
          l = l.v.target;
        }
        if (l.v.target === null) {
          rt.raiseException("function " + l.v.name + " does not seem to be implemented");
        }
        return rt.getCompatibleFunc(l.v.defineType, l.v.name, args).apply(null, [rt, bindThis].concat(slice.call(args)));
      }
    },
    "o(&)": {
      "#default": function(rt, l, r) {
        var t;
        if (r === void 0) {
          t = rt.normalPointerType(l.t);
          return rt.val(t, rt.makeNormalPointerValue(l));
        } else {
          rt.raiseException("you cannot cast bitwise and on function");
        }
      }
    }
  };
  this.types["pointer_normal"] = {
    "o(*)": {
      "#default": function(rt, l, r) {
        if (r === void 0) {
          return l.v.target;
        } else {
          rt.raiseException("you cannot multiply a pointer");
        }
      }
    },
    "o(->)": {
      "#default": function(rt, l, r) {
        return rt.getMember(l.v.target, r);
      }
    }
  };
  this.types["pointer_array"] = {
    "o(*)": {
      "#default": function(rt, l, r) {
        var arr, ret;
        if (r === void 0) {
          arr = l.v.target;
          if (l.v.position >= arr.length) {
            rt.raiseException("index out of bound " + l.v.position + " >= " + arr.length);
          } else if (l.v.position < 0) {
            rt.raiseException("negative index " + l.v.position);
          }
          ret = arr[l.v.position];
          ret.array = arr;
          ret.arrayIndex = l.v.position;
          return ret;
        } else {
          rt.raiseException("you cannot multiply a pointer");
        }
      }
    },
    "o([])": {
      "#default": function(rt, l, r) {
        r = rt.types["pointer_array"]["o(+)"]["#default"](rt, l, r);
        return rt.types["pointer_array"]["o(*)"]["#default"](rt, r);
      }
    },
    "o(->)": {
      "#default": function(rt, l, r) {
        l = rt.types["pointer_array"]["o(*)"]["#default"](rt, l);
        return rt.getMember(l, r);
      }
    },
    "o(-)": {
      "#default": function(rt, l, r) {
        var i;
        if (rt.isNumericType(r.t)) {
          i = rt.cast(rt.intTypeLiteral, r).v;
          return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position - i));
        } else if (rt.isArrayType(r.t)) {
          if (l.v.target === r.v.target) {
            return l.v.position - r.v.position;
          } else {
            rt.raiseException("you cannot perform minus on pointers pointing to different arrays");
          }
        } else {
          rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
        }
      }
    },
    "o(<)": {
      "#default": function(rt, l, r) {
        if (rt.isArrayType(r.t)) {
          if (l.v.target === r.v.target) {
            return l.v.position < r.v.position;
          } else {
            rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
          }
        } else {
          rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
        }
      }
    },
    "o(>)": {
      "#default": function(rt, l, r) {
        if (rt.isArrayType(r.t)) {
          if (l.v.target === r.v.target) {
            return l.v.position > r.v.position;
          } else {
            rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
          }
        } else {
          rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
        }
      }
    },
    "o(<=)": {
      "#default": function(rt, l, r) {
        if (rt.isArrayType(r.t)) {
          if (l.v.target === r.v.target) {
            return l.v.position <= r.v.position;
          } else {
            rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
          }
        } else {
          rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
        }
      }
    },
    "o(>=)": {
      "#default": function(rt, l, r) {
        if (rt.isArrayType(r.t)) {
          if (l.v.target === r.v.target) {
            return l.v.position >= r.v.position;
          } else {
            rt.raiseException("you cannot perform compare on pointers pointing to different arrays");
          }
        } else {
          rt.raiseException(rt.makeTypeString(r.t) + " is not an array pointer type");
        }
      }
    },
    "o(+)": {
      "#default": function(rt, l, r) {
        var i;
        if (rt.isNumericType(r.t)) {
          i = rt.cast(rt.intTypeLiteral, r).v;
          return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position + i));
        } else {
          rt.raiseException("cannot add non-numeric to a pointer");
        }
      }
    },
    "o(+=)": {
      "#default": function(rt, l, r) {
        r = rt.types["pointer_array"]["o(+)"]["#default"](rt, l, r);
        return rt.types["pointer"]["="]["#default"](rt, l, r);
      }
    },
    "o(-=)": {
      "#default": function(rt, l, r) {
        r = rt.types["pointer_array"]["o(-)"]["#default"](rt, l, r);
        return rt.types["pointer"]["="]["#default"](rt, l, r);
      }
    },
    "o(++)": {
      "#default": function(rt, l, dummy) {
        if (!l.left) {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
        if (dummy) {
          return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position++));
        } else {
          l.v.position++;
          return l;
        }
      }
    },
    "o(--)": {
      "#default": function(rt, l, dummy) {
        if (!l.left) {
          rt.raiseException(rt.makeValString(l) + " is not a left value");
        }
        if (dummy) {
          return rt.val(l.t, rt.makeArrayPointerValue(l.v.target, l.v.position--));
        } else {
          l.v.position--;
          return l;
        }
      }
    }
  };
  return this;
};

var format_type_map, printf, validate_format,
  slice = [].slice;

printf = require("printf");

format_type_map = function(rt, ctrl) {
  switch (ctrl) {
    case "d":
    case "i":
      return rt.intTypeLiteral;
    case "u":
    case "o":
    case "x":
    case "X":
      return rt.unsignedintTypeLiteral;
    case "f":
    case "F":
      return rt.floatTypeLiteral;
    case "e":
    case "E":
    case "g":
    case "G":
    case "a":
    case "A":
      return rt.doubleTypeLiteral;
    case "c":
      return rt.charTypeLiteral;
    case "s":
      return rt.normalPointerType(rt.charTypeLiteral);
    case "p":
      return rt.normalPointerType(rt.voidTypeLiteral);
    case "n":
      return rt.raiseException("%n is not supported");
  }
};

validate_format = function() {
  var casted, ctrl, format, i, params, results, target, type, val;
  format = arguments[0], params = 2 <= arguments.length ? slice.call(arguments, 1) : [];
  i = 0;
  results = [];
  while ((ctrl = /(?:(?!%).)%([diuoxXfFeEgGaAcspn])/.exec(format)) != null) {
    type = format_type_map(ctrl[1]);
    if (params.length <= i) {
      rt.raiseException("insufficient arguments (at least " + (i + 1) + " is required)");
    }
    target = params[i++];
    casted = rt.cast(type, target);
    if (rt.isStringType(casted.t)) {
      results.push(val = rt.getStringFromCharArray(casted));
    } else {
      results.push(val = casted.v);
    }
  }
  return results;
};

module.exports = {
  load: function(rt) {
    var __printf, _printf, _sprintf, pchar, stdio;
    rt.include("cstring");
    pchar = rt.normalPointerType(rt.charTypeLiteral);
    stdio = rt.config.stdio;
    __printf = function() {
      var format, params, parsed_params, retval;
      format = arguments[0], params = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (rt.isStringType(format.t)) {
        format = format.v.target;
        parsed_params = validate_format.apply(null, [format].concat(slice.call(params)));
        retval = printf.apply(null, [format].concat(slice.call(parsed_params)));
        return rt.makeCharArrayFromString(retval);
      } else {
        return rt.raiseException("format must be a string");
      }
    };
    _sprintf = function() {
      var _this, format, params, retval, rt, target;
      rt = arguments[0], _this = arguments[1], target = arguments[2], format = arguments[3], params = 5 <= arguments.length ? slice.call(arguments, 4) : [];
      retval = __printf.apply(null, [format].concat(slice.call(params)));
      rt.getFunc("global", "strcpy", [pchar, pchar])(rt, null, [target, retval]);
      return rt.val(rt.intTypeLiteral, retval.length);
    };
    rt.regFunc(_sprintf, "global", "sprintf", [pchar, pchar, "?"], rt.intTypeLiteral);
    _printf = function() {
      var _this, format, params, retval, rt;
      rt = arguments[0], _this = arguments[1], format = arguments[2], params = 4 <= arguments.length ? slice.call(arguments, 3) : [];
      retval = __printf.apply(null, [format].concat(slice.call(params)));
      stdio.write(retval);
      return rt.val(rt.intTypeLiteral, retval.length);
    };
    return rt.regFunc(_printf, "global", "printf", [pchar, "?"], rt.intTypeLiteral);
  }
};

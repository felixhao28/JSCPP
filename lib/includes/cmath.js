module.exports = {
  load: function(rt) {
    var g, tDouble;
    tDouble = rt.doubleTypeLiteral;
    g = "global";
    rt.regFunc((function(rt, _this, x) {
      return Math.cos(x.v);
    }), g, "cos", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.sin(x.v);
    }), g, "sin", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.tan(x.v);
    }), g, "tan", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.acos(x.v);
    }), g, "acos", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.asin(x.v);
    }), g, "asin", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.atan(x.v);
    }), g, "atan", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, y, x) {
      return Math.atan(y.v / x.v);
    }), g, "atan2", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.cosh(x.v);
    }), g, "cosh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.sinh(x.v);
    }), g, "sinh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.tanh(x.v);
    }), g, "tanh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.acosh(x.v);
    }), g, "acosh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.asinh(x.v);
    }), g, "asinh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.atanh(x.v);
    }), g, "atanh", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.exp(x.v);
    }), g, "exp", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.log(x.v);
    }), g, "log", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.log10(x.v);
    }), g, "log10", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x, y) {
      return Math.pow(x.v, y.v);
    }), g, "pow", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.sqrt(x.v);
    }), g, "sqrt", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.ceil(x.v);
    }), g, "ceil", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.floor(x.v);
    }), g, "floor", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.abs(x.v);
    }), g, "fabs", [tDouble], tDouble);
    rt.regFunc((function(rt, _this, x) {
      return Math.abs(x.v);
    }), g, "abs", [tDouble], tDouble);
  }
};

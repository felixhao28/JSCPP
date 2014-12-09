module.exports = {
	load: function (rt) {
		rt.regFunc(function(rt, _this, x){return Math.cos(x);}, 'global', 'cos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.sin(x);}, 'global', 'sin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.tan(x);}, 'global', 'tan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.acos(x);}, 'global', 'acos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.asin(x);}, 'global', 'asin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.atan(x);}, 'global', 'atan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, y, x){return Math.atan(y/x);}, 'global', 'atan2', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x){return Math.cosh(x);}, 'global', 'cosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.sinh(x);}, 'global', 'sinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.tanh(x);}, 'global', 'tanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.acosh(x);}, 'global', 'acosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.asinh(x);}, 'global', 'asinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x){return Math.atanh(x);}, 'global', 'atanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
	}
}
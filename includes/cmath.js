module.exports = {
	load: function(rt) {
		rt.regFunc(function(rt, _this, x) {
			return Math.cos(x);
		}, 'global', 'cos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sin(x);
		}, 'global', 'sin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tan(x);
		}, 'global', 'tan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acos(x);
		}, 'global', 'acos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asin(x);
		}, 'global', 'asin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atan(x);
		}, 'global', 'atan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, y, x) {
			return Math.atan(y / x);
		}, 'global', 'atan2', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.cosh(x);
		}, 'global', 'cosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sinh(x);
		}, 'global', 'sinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tanh(x);
		}, 'global', 'tanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acosh(x);
		}, 'global', 'acosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asinh(x);
		}, 'global', 'asinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atanh(x);
		}, 'global', 'atanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.exp(x);
		}, 'global', 'exp', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log(x);
		}, 'global', 'log', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log10(x);
		}, 'global', 'log10', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x, y) {
			return Math.pow(x, y);
		}, 'global', 'pow', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sqrt(x);
		}, 'global', 'sqrt', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.ceil(x);
		}, 'global', 'ceil', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.floor(x);
		}, 'global', 'floor', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x);
		}, 'global', 'fabs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x);
		}, 'global', 'abs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
	}
}
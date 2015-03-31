module.exports = {
	load: function(rt) {
		rt.regFunc(function(rt, _this, x) {
			return Math.cos(x.v);
		}, 'global', 'cos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sin(x.v);
		}, 'global', 'sin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tan(x.v);
		}, 'global', 'tan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acos(x.v);
		}, 'global', 'acos', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asin(x.v);
		}, 'global', 'asin', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atan(x.v);
		}, 'global', 'atan', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, y, x) {
			return Math.atan(y.v / x.v);
		}, 'global', 'atan2', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.cosh(x.v);
		}, 'global', 'cosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sinh(x.v);
		}, 'global', 'sinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.tanh(x.v);
		}, 'global', 'tanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.acosh(x.v);
		}, 'global', 'acosh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.asinh(x.v);
		}, 'global', 'asinh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.atanh(x.v);
		}, 'global', 'atanh', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);

		rt.regFunc(function(rt, _this, x) {
			return Math.exp(x.v);
		}, 'global', 'exp', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log(x.v);
		}, 'global', 'log', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.log10(x.v);
		}, 'global', 'log10', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x, y) {
			return Math.pow(x.v, y.v);
		}, 'global', 'pow', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.sqrt(x.v);
		}, 'global', 'sqrt', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.ceil(x.v);
		}, 'global', 'ceil', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.floor(x.v);
		}, 'global', 'floor', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x.v);
		}, 'global', 'fabs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
		rt.regFunc(function(rt, _this, x) {
			return Math.abs(x.v);
		}, 'global', 'abs', [rt.doubleTypeLiteral], rt.doubleTypeLiteral);
	}
}
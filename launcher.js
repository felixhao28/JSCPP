//logger = require('tracer').colorConsole();
var CRuntime = require('./rt')
var Interpreter = require('./interpreter');
var ast = require('./ast');
var prepast = require('./prepast');
var preprocessor = require('./preprocessor');
var inputbuffer = '';

module.exports = {
	run: function(code, input) {
		var rt = new CRuntime({
			stdio: {
				drain: function() {
					var x = inputbuffer;
					inputbuffer = null;
					return x;
				},
				write: function(s) {
					process.stdout.write(s);
				}
			},
			includes: {
				iostream: require('./includes/iostream'),
				cctype: require('./includes/cctype'),
				cstring: require('./includes/cstring'),
				cmath: require('./includes/cmath'),
			}
		});
		inputbuffer = input.toString();
		code = code.toString();
		code = preprocessor(rt, prepast, code);
		var tree = ast.parse(code);
		var interpreter = new Interpreter(rt);
		interpreter.run(tree);
		var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
		return exitCode;
	}
};

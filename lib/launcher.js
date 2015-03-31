//logger = require('tracer').colorConsole();
var CRuntime = require('./rt')
var Interpreter = require('./interpreter');
var ast = require('./ast');
var preprocessor = require('./preprocessor');

function mergeConfig(a, b) {
    for (o in b) {
        if (o in a && typeof b[o] === 'object') {
            mergeConfig(a[o], b[o]);
        } else {
            a[o] = b[o];
        }
    }
}

module.exports = {
    includes: {
        iostream: require('./includes/iostream'),
        cctype: require('./includes/cctype'),
        cstring: require('./includes/cstring'),
        cmath: require('./includes/cmath'),
        cstdio: require('./includes/cstdio'),
        cstdlib: require('./includes/cstdlib')
    },

    run: function(code, input, config) {
        var inputbuffer = input.toString();
        var self = this;
        var _config = {
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
            includes: self.includes
        };
        mergeConfig(_config, config);
        var rt = new CRuntime(_config);
        code = code.toString();
        code = preprocessor.parse(rt, code);
        var tree = ast.parse(code);
        var interpreter = new Interpreter(rt);
        interpreter.run(tree);
        var exitCode = rt.getFunc('global', 'main', [])(rt, null, []).v;
        return exitCode;
    }
};

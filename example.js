var JSCPP = require('./lib/main');
var fs = require('fs');

function go(code, input) {
    var exitcode = JSCPP.launcher.run(code, input);
    console.info('\nprogram exited with code ' + exitcode);
}

fs.readFile('./test/maze.pass.cpp', function(err, code) {
    if (err) throw err;
    fs.readFile('./test/maze.in', function(err, input) {
        if (err) throw err;
        go(code, input);
    });
});

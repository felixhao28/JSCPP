var launcher = require('./launcher');
var fs = require('fs');

fs.readFile('./target.cpp', function(err, code) {
	if (err) throw err;
	fs.readFile('./input.txt', function(err, input) {
		if (err) throw err;
		var exitcode = launcher.run(code, input);
		console.info('program exited with code ' + exitcode);
	});
});
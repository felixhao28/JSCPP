var JSCPP = require("./lib/main");
var fs = require("fs");

function go(code, input) {
    var exitcode = JSCPP.launcher.run(code, input);
    console.info("\nprogram exited with code " + exitcode);
}

var cppFile, inFile;

if (process.argv.length > 2) {
    testName = process.argv[2];
    if (testName.slice(-4) !== ".cpp") {
        cppFile = testName + ".pass.cpp";
    } else {
        cppFile = testName;
    }
    if (process.argv.length === 3) {
        inFile = testName + ".in";
    } else {
        inFile = process.argv[3];
    }
} else {
    cppFile = "maze.pass.cpp";
    inFile = "maze.in";
}

fs.readFile("./test/" + cppFile, function(err, code) {
    if (err) throw err;
    fs.readFile("./test/" + inFile, function(err, input) {
        if (err) throw err;
        go(code, input);
    });
});

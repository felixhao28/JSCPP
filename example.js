var JSCPP = require("./lib/main");
var fs = require("fs");

function go(code, input) {
    var exitcode = JSCPP.launcher.run(code, input);
    console.info("\nprogram exited with code " + exitcode);
}

var cppFile, input;

if (process.argv.length > 2) {
    testName = process.argv[2];
    if (testName.slice(-4) !== ".cpp") {
        cppFile = testName + ".cpp";
    } else {
        cppFile = testName;
    }
} else {
    cppFile = "maze.cpp";
}

input = "5"     + "\n" +
        "....#" + "\n" +
        ".#.@." + "\n" +
        ".#@.." + "\n" +
        "#...." + "\n" +
        "....." + "\n" +
        "4"

fs.readFile("./test/" + cppFile, function(err, code) {
    if (err) throw err;
    go(code, input);
});

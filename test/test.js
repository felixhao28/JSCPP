var JSCPP, assert, chai, doTest, expect, file, files, fs, i, len, prepareOutput, testFolder, todolist;

assert = require("assert");

fs = require("fs");

JSCPP = require("../lib/main");

chai = require("chai");

expect = chai.expect;

testFolder = './test/';

doTest = function(cppFile, inFile, outFile, cb) {
  var _cpp, _in, _out, outputBuffer, result;
  outputBuffer = "";
  _cpp = fs.readFileSync(testFolder + (cppFile + ".cpp"));
  _in = fs.readFileSync(testFolder + inFile);
  _out = fs.readFileSync(testFolder + outFile);
  console.log("lauching " + cppFile + ".cpp, input = " + inFile + ", output = " + outFile);
  JSCPP.launcher.run(_cpp, _in, {
    stdio: {
      write: function(str) {
        return outputBuffer += str;
      }
    }
  });
  result = outputBuffer;
  return function() {
    return cb(result, _out.toString());
  };
};

todolist = [];

files = fs.readdirSync(testFolder);

for (i = 0, len = files.length; i < len; i++) {
  file = files[i];
  if (file.slice(-4) === ".cpp") {
    todolist.push(file.slice(0, -4));
  }
}

prepareOutput = function(str) {
  return str.replace(/\r\n/g, "\n").replace(/\r/, "\n").trim();
};

describe("Tests", function() {
  var cppFile, j, len1, results;
  results = [];
  for (j = 0, len1 = todolist.length; j < len1; j++) {
    cppFile = todolist[j];
    results.push(describe(cppFile, (function() {
      var inFile, outFile, shouldPass, testName;
      if (cppFile.slice(-5) === ".fail") {
        testName = cppFile.slice(0, -5);
        inFile = testName + ".in";
        outFile = testName + ".out";
        shouldPass = false;
      } else if (cppFile.slice(-5) === ".pass") {
        testName = cppFile.slice(0, -5);
        inFile = testName + ".in";
        outFile = testName + ".out";
        shouldPass = true;
      } else {
        return function() {};
      }
      return doTest(cppFile, inFile, outFile, function(output, expected) {
        output = prepareOutput(output);
        expected = prepareOutput(expected);
        if (shouldPass) {
          return it("should match expected output", function() {
            return expect(output).to.equal(expected);
          });
        } else {
          return it("should not match expected output", function() {
            return expect(output).not.to.equal(expected);
          });
        }
      });
    })()));
  }
  return results;
});

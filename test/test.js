var JSCPP, _describe, _it, assert, chai, doCases, doSample, doTest, expect, failedTest, fs, passedTest, pendingTests, prepareOutput, ref, skippedTest, task, test, testFinished, testFolder, testName, tests, todolist, totalNum, tryAddTest,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

assert = require("assert");

fs = require("fs");

JSCPP = require("../lib/main");

chai = require("chai");

expect = chai.expect;

testFolder = './test/';

prepareOutput = function(str) {
  var lines;
  if (str != null) {
    return lines = str.replace(/\r\n/g, "\n").replace(/\r/, "\n").replace(/[ \t]+\n/, "\n").replace(/\s$/, "");
  } else {
    return null;
  }
};

if (process.argv[2] === "direct") {
  _describe = function(testName, cb) {
    return cb();
  };
  _it = function(text, cb) {
    var ans;
    ans = cb();
    if (!ans) {
      return console.log("failed");
    } else {
      return console.log("passed");
    }
  };
} else {
  _describe = describe;
  _it = it;
}

passedTest = [];

failedTest = [];

skippedTest = [];

doTest = function(test, cb) {
  var cases, success;
  success = true;
  cases = test.cases;
  doCases(cases, function(result) {
    return success = success && result;
  });
  return cb(success);
};

doCases = function(cases, cb) {
  var code, cppFile, except, expected, i, input, j, len, sample, success;
  success = true;
  for (i = j = 0, len = cases.length; j < len; i = ++j) {
    sample = cases[i];
    cppFile = sample.cpp;
    code = fs.readFileSync(testFolder + cppFile);
    input = sample["in"] || "";
    expected = prepareOutput(sample.out) || "";
    except = prepareOutput(sample.exception);
    _describe("sample " + i, function() {
      return doSample(code, input, expected, except, function(result) {
        return success = success && result;
      });
    });
  }
  return cb(success);
};

doSample = function(code, input, expected, except, cb) {
  var config, e, output, outputBuffer;
  outputBuffer = "";
  config = {
    stdio: {
      write: function(str) {
        outputBuffer += str;
        return str.length;
      }
    }
  };
  try {
    return JSCPP.run(code, input, config);
  } catch (_error) {
    e = _error;
    if (except) {
      return _it("expected exception", function() {
        var eStr, ok;
        eStr = prepareOutput(e.toString());
        ok = eStr.match(except);
        assert.ok(ok);
        return cb(ok);
      });
    } else {
      return _it("an error occurred", function() {
        assert.ok(false);
        return cb(false);
      });
    }
  } finally {
    output = prepareOutput(outputBuffer);
    _it("should match expected output", function() {
      expect(output).to.equal(expected);
      return cb(output === expected);
    });
  }
};

tests = JSON.parse(fs.readFileSync(testFolder + "test.json"));

todolist = [];

ref = tests.tests;
for (testName in ref) {
  test = ref[testName];
  todolist.push({
    name: testName,
    test: test
  });
}

totalNum = todolist.length;

tryAddTest = function(testName, test) {
  var after, dep, j, len, waitingFor;
  after = test.after;
  waitingFor = null;
  if (after != null) {
    for (j = 0, len = after.length; j < len; j++) {
      dep = after[j];
      if (indexOf.call(passedTest, dep) < 0) {
        if (indexOf.call(failedTest, dep) >= 0) {
          testFinished(awaitingTask.name)("skip", "test " + testName + " failed");
          break;
        } else if (indexOf.call(skippedTest, dep) >= 0) {
          testFinished(awaitingTask.name)("skip", "test " + testName + " skipped");
          return;
          break;
        } else {
          waitingFor = dep;
          break;
        }
      }
    }
  }
  if (waitingFor !== null) {
    if (!(waitingFor in pendingTests)) {
      pendingTests[waitingFor] = [];
    }
    return pendingTests[waitingFor].push({
      name: testName,
      test: test
    });
  } else {
    return _describe(testName, function() {
      return doTest(test, testFinished(testName));
    });
  }
};

pendingTests = {};

testFinished = function(testName) {
  return function(result, reason) {
    var awaitingTask, j, len, ref1, results, skipped, t;
    if (result === true) {
      passedTest.push(testName);
    } else if (result === false) {
      failedTest.push(testName);
    } else if (result === "skip") {
      skippedTest.push(testName({
        name: awaitingTask.name,
        reason: reason
      }));
    }
    if (testName in pendingTests) {
      while (awaitingTask = pendingTests[testName].pop()) {
        if (result === true) {
          tryAddTest(awaitingTask.name, awaitingTask.test);
        } else if (result === false) {
          testFinished(awaitingTask.name)("skip", "test " + testName + " failed");
        } else if (result === "skip") {
          testFinished(awaitingTask.name)("skip", "test " + testName + " skipped");
        }
      }
      if (((ref1 = pendingTests[testName]) != null ? ref1.length : void 0) === 0) {
        delete pendingTests[testName];
      }
    }
    if (todolist.length === 0) {
      if (pendingTests.length > 0) {
        console.warn("circular task dependency detected " + ((function() {
          var results;
          results = [];
          for (t in pendingTests) {
            results.push(t);
          }
          return results;
        })()));
      }
      if (failedTest.length + passedTest.length + skippedTest.length === totalNum) {
        results = [];
        for (j = 0, len = skippedTest.length; j < len; j++) {
          skipped = skippedTest[j];
          results.push(console.warn(skipped.name + " is skipped because " + skipped.reason));
        }
        return results;
      }
    }
  };
};

while (task = todolist.pop()) {
  tryAddTest(task.name, task.test);
}

assert = require "assert"
fs = require "fs"
JSCPP = require "../lib/main"
chai = require "chai"
yaml = require "js-yaml"

expect = chai.expect

testFolder = './test/'

prepareOutput = (str) ->
    if str?
        lines = str.replace(/\r\n/g, "\n").replace(/\r/, "\n").replace(/[ \t]+\n/, "\n").replace(/\s$/, "")
    else
        null

if process.argv[2] is "direct"
    _describe = (testName, cb) ->
        do cb
    _it = (text, cb) ->
        ans = do cb
        if not ans
            console.log "failed"
        else
            console.log "passed"
else
    _describe = describe
    _it = it

passedTest = []
failedTest = []
skippedTest = []

doTest = (test, cb) ->
    success = true
    cases = test.cases
    if not Array.isArray cases
        cases = [cases]
    doCases cases, (result) ->
        success = success and result
    cb success

doCases = (cases, cb) ->
    success = true
    for sample, i in cases
        cppFile = sample.cpp
        code = fs.readFileSync testFolder + cppFile
        input = sample.in or ""
        expected = prepareOutput(sample.out)
        except = prepareOutput(sample.exception)
        exitcode = sample.exitcode
        _describe "#{cppFile}", ->
            doSample code, input, expected, except, exitcode, (result) ->
                success = success and result
    cb success

doSample = (code, input, expected, except, exp_exitcode, cb) ->
    outputBuffer = ""

    config =
        stdio:
            write: (str) ->
                outputBuffer += str
                str.length
    try
        exitcode = JSCPP.run(code, input, config)
    catch e
        if except
            _it "expected exception", ->
                eStr = prepareOutput e.toString()
                ok = eStr.match except
                assert.ok ok
                cb ok
        else
            _it "an error occurred", ->
                assert.ok false
                cb false
    finally
        if expected?
            output = prepareOutput outputBuffer
            _it "should match expected output", ->
                expect(output).to.equal(expected)
                cb output is expected
        else if exp_exitcode?
            _it "should match exit code", ->
                expect(exitcode).to.equal(exp_exitcode)
                cb exitcode is exp_exitcode

tests = yaml.safeLoad fs.readFileSync testFolder + "test.yaml"

todolist = []

for testName, test of tests.tests
    todolist.push
        name: testName
        test: test

totalNum = todolist.length

tryAddTest = (testName, test) ->
    after = test.after
    waitingFor = null
    if after?
        for dep in after
            if dep not in passedTest
                if dep in failedTest
                    testFinished(awaitingTask.name)("skip", "test #{testName} failed")
                    break
                else if dep in skippedTest
                    testFinished(awaitingTask.name)("skip", "test #{testName} skipped")
                    return
                    break
                else
                    waitingFor = dep
                    break

    if waitingFor isnt null
        if waitingFor not of pendingTests
            pendingTests[waitingFor] = []
        pendingTests[waitingFor].push
            name: testName
            test: test
    else
        _describe testName, ->
            doTest test, testFinished(testName)

pendingTests = {}

testFinished = (testName) ->
    (result, reason) ->
        if result is true
            passedTest.push testName
        else if result is false
            failedTest.push testName
        else if result is "skip"
            skippedTest.push testName
                name: awaitingTask.name
                reason: reason

        if testName of pendingTests
            while awaitingTask = pendingTests[testName].pop()
                if result is true
                    tryAddTest awaitingTask.name, awaitingTask.test
                else if result is false
                    testFinished(awaitingTask.name)("skip", "test #{testName} failed")
                else if result is "skip"
                    testFinished(awaitingTask.name)("skip", "test #{testName} skipped")
            
            if pendingTests[testName]?.length is 0
                delete pendingTests[testName]

        if todolist.length is 0
            # should finish
            if pendingTests.length > 0
                console.warn "circular task dependency detected #{t for t of pendingTests}"

            if failedTest.length + passedTest.length + skippedTest.length is totalNum
                for skipped in skippedTest
                    console.warn "#{skipped.name} is skipped because #{skipped.reason}"

while task = todolist.pop()
    tryAddTest task.name, task.test
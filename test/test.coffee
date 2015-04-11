assert = require "assert"
fs = require "fs"
JSCPP = require "../lib/main"
chai = require "chai"

expect = chai.expect

testFolder = './test/'

prepareOutput = (str) ->
    str.replace(/\r\n/g, "\n").replace(/\r/, "\n").trim()

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
    cppFiles = test.cpp
    cases = test.cases
    for cppFile in cppFiles
        code = fs.readFileSync testFolder + cppFile
        _describe "source #{cppFile}", ->
            doSource code, cases, (result) ->
                success = success and result
    cb success

doSource = (code, cases, cb) ->
    success = true
    for sample, i in cases
        input = sample.in
        expected = prepareOutput(sample.out)
        _describe "sample #{i}", ->
            doSample code, input, expected, (result) ->
                success = success and result
    cb success

doSample = (code, input, expected, cb) ->
    outputBuffer = ""

    config =
        stdio:
            write: (str) ->
                outputBuffer += str
                str.length
    try
        JSCPP.run(code, input, config)
        output = prepareOutput outputBuffer
        _it "should match expected output", ->
            expect(output).to.equal(expected)
            cb output is expected
    catch e
        _it "an error occurred", ->
            assert.notOk(e)
            cb false

tests = JSON.parse fs.readFileSync testFolder + "test.json"

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